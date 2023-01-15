import { fontSize } from "@mui/system";
import { globalStyle, style } from "@vanilla-extract/css";
import { monoFontClass } from "./font.css";

const darkQuery = "(prefers-color-scheme: dark)";

export const frequencyContainerClass = style({
  width: "100%",
  display: "block",
});

export const characterTypeContainerClass = style({
  width: "100%",
  display: "block",
});

export const characterTypeLabelClass = style({
  width: "100%",
  display: "block",
});

export const characterRatioControllerContainerClass = style({
  width: "100%",
  display: "grid",
  gridTemplate: "auto / 1fr 3em",
  columnGap: "30px",
});

export const flexChipContainerClass = style({
  display: "flex",
  gap: "6px",
  flexWrap: "wrap",
  "@media": {
    "not (pointer: fine)": {
      gap: "12px",
    },
  },
});

export const keyTopWrapperClass = style({
  display: "inline-table",
  border: "1px solid #999",
  borderBottom: "3px solid #555",
  borderRadius: "0.3em",
  background: "#f8f8f8",
  boxShadow: "0.2em #ccc",
  "@media": {
    [darkQuery]: {
      borderColor: "#333",
      borderBottomColor: "#111",
      background: "#666",
    },
  },
});

export const keyTopClass = style([
  monoFontClass,
  {
    paddingBlock: "0.25em",
    paddingInline: "0.5em",
    display: "table-cell",
    textAlign: "center",
    verticalAlign: "middle",
    fontSize: "0.85em",
  },
]);

export const oneLineDescriptionListClass = style({
  display: "grid",
  gridTemplate: "auto / auto 1fr",
  columnGap: "1em",
  rowGap: "0.5em",
});

globalStyle(`${oneLineDescriptionListClass} > dt`, {
  gridColumn: "1",
});

globalStyle(`${oneLineDescriptionListClass} > dd`, {
  gridColumn: "2",
  marginInlineStart: "0",
});
