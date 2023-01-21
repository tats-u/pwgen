import { style } from "@vanilla-extract/css";
import { monoFontFamily } from "./styleBase";

/**
 * Monospace font style definition
 */
export const monoFontClass = style({
  fontFamily: monoFontFamily,
  fontVariantLigatures: "none",
});
