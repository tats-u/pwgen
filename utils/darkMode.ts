import { useMediaQuery } from "@mui/material";

export const darkModeQuery = "(prefers-color-scheme: dark)";

export const usePrefersDarkMode = () => useMediaQuery(darkModeQuery);
