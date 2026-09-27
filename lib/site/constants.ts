/** Desktop-sized windows get the sideways homepage; phones and short screens keep the vertical layout. */
export const H_QUERY = '(min-width:901px) and (min-height:600px)'
export const INTRO_KEY = 'jada-entered'

/** Runs before first paint on the homepage so the right layout and intro state show immediately. */
export const PRE_PAINT = `(function(){var d=document.documentElement;try{if(!location.hash&&!sessionStorage.getItem('${INTRO_KEY}'))d.classList.add('intro-open')}catch(e){d.classList.add('intro-open')}if(matchMedia('${H_QUERY}').matches)d.classList.add('h-mode')})()`
