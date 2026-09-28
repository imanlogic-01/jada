/** Desktop-sized windows get the sideways homepage; phones and short screens keep the vertical layout. */
export const H_QUERY = '(min-width:901px) and (min-height:600px)'
export const INTRO_KEY = 'jada-entered'

/** Runs before first paint on the homepage so the right layout and intro state show immediately. */
export const PRE_PAINT = `(function(){var d=document.documentElement;try{if(!location.hash&&!sessionStorage.getItem('${INTRO_KEY}'))d.classList.add('intro-open')}catch(e){d.classList.add('intro-open')}if(matchMedia('${H_QUERY}').matches)d.classList.add('h-mode')})()`

/**
 * JADA's Brevo subscription form ("Personal updates from JADA"). This URL is public (it appears in any
 * page that embeds the form); NEXT_PUBLIC_BREVO_FORM_ACTION overrides it if the form is ever replaced.
 */
export const BREVO_FORM_ACTION = process.env.NEXT_PUBLIC_BREVO_FORM_ACTION || 'https://a08205c0.sibforms.com/serve/MUIFAGETsxLdebSnjrm7eRctQavRfOnBvqT0v8v9NJbQoEyPkU7wATD513P9mVkW-_V_mcQ3jaG5p9gNYV3V1iNZvtGt6HPi6XS7fBJ4pEzAuY60e7937_rhm2fcouFnAYfoSUx7s9pr8YQmrRVbdWo1NU6_XeG2W6BVodgnvhtEpv53yRIsnf3f9Qn1fQXN1sKwxWwOCSSZy69dgQ=='
