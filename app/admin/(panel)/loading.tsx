export default function Loading() {
  return (
    <div className="adm-page" aria-busy="true" aria-label="Loading">
      <div className="skel" style={{ width: 90, height: 10, marginBottom: 16 }} />
      <div className="skel" style={{ width: '46%', height: 52, marginBottom: 40 }} />
      <div className="adm-card adm-stack">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ display: 'grid', gap: 10 }}>
            <div className="skel" style={{ width: 120, height: 10 }} />
            <div className="skel" style={{ height: i === 2 ? 110 : 46 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
