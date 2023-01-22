/**
 * Monospace font
 *
 * 3:5 aspect ratio fonts are prioritized because there is no CJK characters
 */
export const monoFontFamily = `SF Mono, Fira Code, Source Code Pro, Cascadia Code, Fira Mono, Firge35, Firge35 Console, Firge35Nerd Console, Firge35Nerd, Dejavu Sans Mono, Firge, Firge Console, FirgeNerd, FirgeNerd Console, HackGen35, HackGen35 Console, HackGen, HackGen Console, Menlo, Consolas, Inconsolata, Ubuntu Mono, monospace`;

/**
 * Media query for touch devices with*out* `@media`
 */
export const touchMediaQueryWithoutMedia = "(pointer: coarse)";

/**
 * Media query for touch devices with `@media`
 */
export const touchMediaQueryWithMedia = `@media ${touchMediaQueryWithoutMedia}`;
