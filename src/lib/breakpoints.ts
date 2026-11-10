/** Layout breakpoints shared by CSS-in-JS, <picture> sources and GSAP media queries. Keep in sync with global.css (760/761px). */
export const MOBILE_MAX = 760;
/** Phones: portrait hero images are served below this width. */
export const MOBILE_MEDIA = `(max-width: ${MOBILE_MAX}px)`;
export const DESKTOP_MEDIA = `(min-width: ${MOBILE_MAX + 1}px)`;
