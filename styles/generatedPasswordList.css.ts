import { style } from "@vanilla-extract/css";

/**
 * Line break should be allowed anywhere in passwords
 */
export const allowInterWordWrapClass = style({
  overflowWrap: "anywhere",
});
