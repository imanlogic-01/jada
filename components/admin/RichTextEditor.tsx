'use client'
import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Placeholder } from '@tiptap/extensions'
import { IMAGE_TYPES } from '@/lib/content/images'
import { uploadImage } from './ImageField'

type Props = { id?: string; value: string; onChange: (html: string) => void; invalid?: boolean; describedBy?: string }

/** A deliberately small editor: headings, emphasis, lists, quotes, links and images. Output is sanitised on save. */
export function RichTextEditor({ id, value, onChange, invalid, describedBy }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const editorRef = useRef<Editor | null>(null)

  const insertImages = async (editor: Editor, files: File[], pos?: number) => {
    setUploadError('')
    for (const file of files) {
      setUploading((n) => n + 1)
      const result = await uploadImage(file, 'journal').catch(() => ({ error: 'Upload failed. Please try again.' }))
      setUploading((n) => n - 1)
      if ('error' in result) {
        setUploadError(result.error)
        continue
      }
      const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
      const chain = editor.chain().focus()
      if (pos !== undefined) chain.insertContentAt(pos, { type: 'image', attrs: { src: result.url, alt } }).run()
      else chain.setImage({ src: result.url, alt }).run()
    }
  }
  const imageFiles = (list: FileList | null | undefined) => [...(list ?? [])].filter((f) => f.type in IMAGE_TYPES)

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        strike: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
      Image,
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    content: value,
    editorProps: {
      attributes: { ...(id ? { id } : {}), 'aria-label': 'Post body', 'aria-multiline': 'true', role: 'textbox', ...(describedBy ? { 'aria-describedby': describedBy } : {}) },
      handleDrop: (view, event, _slice, moved) => {
        const files = imageFiles(event.dataTransfer?.files)
        if (moved || !files.length || !editorRef.current) return false
        event.preventDefault()
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
        insertImages(editorRef.current, files, pos)
        return true
      },
      handlePaste: (_view, event) => {
        const files = imageFiles(event.clipboardData?.files)
        if (!files.length || !editorRef.current) return false
        insertImages(editorRef.current, files)
        return true
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? '' : editor.getHTML()),
  })
  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  if (!editor) return <div className="rte skel" style={{ height: 420 }} aria-busy="true" />

  // The editor re-renders on every change (shouldRerenderOnTransaction), so these stay current.
  const active = {
    bold: editor.isActive('bold'),
    italic: editor.isActive('italic'),
    underline: editor.isActive('underline'),
    h2: editor.isActive('heading', { level: 2 }),
    h3: editor.isActive('heading', { level: 3 }),
    bullet: editor.isActive('bulletList'),
    ordered: editor.isActive('orderedList'),
    quote: editor.isActive('blockquote'),
    link: editor.isActive('link'),
    canUndo: editor.can().undo(),
    canRedo: editor.can().redo(),
    words: editor.getText().trim().split(/\s+/).filter(Boolean).length,
  }

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined
    const url = prompt('Link address (leave empty to remove the link)', previous ?? 'https://')
    if (url === null) return
    const chain = editor.chain().focus().extendMarkRange('link')
    if (!url.trim() || url.trim() === 'https://') chain.unsetLink().run()
    else chain.setLink({ href: /^(https?:|mailto:|tel:|\/|#)/i.test(url.trim()) ? url.trim() : `https://${url.trim()}` }).run()
  }

  return (
    <div className="rte" aria-invalid={invalid || undefined}>
      <div className="rte-bar" role="toolbar" aria-label="Formatting">
        <Tool label="H2" title="Heading" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} pressed={active.h2} />
        <Tool label="H3" title="Subheading" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} pressed={active.h3} />
        <span className="sep" />
        <Tool label="B" title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} pressed={active.bold} />
        <Tool label="I" title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} pressed={active.italic} />
        <Tool label="U" title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} pressed={active.underline} />
        <span className="sep" />
        <Tool label="• List" title="Bulleted list" onClick={() => editor.chain().focus().toggleBulletList().run()} pressed={active.bullet} />
        <Tool label="1. List" title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} pressed={active.ordered} />
        <Tool label="“ Quote" title="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} pressed={active.quote} />
        <Tool label="— Line" title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
        <span className="sep" />
        <Tool label="Link" title="Add or edit link" onClick={setLink} pressed={active.link} />
        <Tool label={uploading ? 'Uploading…' : 'Image'} title="Insert image" onClick={() => fileRef.current?.click()} disabled={uploading > 0} />
        <span className="sep" />
        <Tool label="↶" title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!active.canUndo} />
        <Tool label="↷" title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!active.canRedo} />
      </div>
      <EditorContent editor={editor} className="rte-content" />
      <div className="rte-status">
        <span>{uploadError ? <span className="fld-error">{uploadError}</span> : 'Tip: drag images straight into the text.'}</span>
        <span>{active.words} words</span>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={Object.keys(IMAGE_TYPES).join(',')}
        multiple
        hidden
        onChange={(e) => {
          insertImages(editor, imageFiles(e.target.files))
          e.target.value = ''
        }}
      />
    </div>
  )
}

function Tool({ label, title, onClick, pressed, disabled }: { label: string; title: string; onClick: () => void; pressed?: boolean; disabled?: boolean }) {
  return (
    // mousedown is prevented so the editor keeps its selection while formatting.
    <button type="button" title={title} aria-label={title} aria-pressed={pressed} disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={onClick}>
      {label}
    </button>
  )
}
