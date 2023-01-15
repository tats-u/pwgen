import "../styles/globals.scss";
import type { AppProps } from "next/app";
import { appWithTranslation } from "next-i18next";
import i18nConfig from "../next-i18n.config";
import { usePrefersDarkMode } from "../utils/darkMode";
import { useMemo } from "react";
import { createTheme, ThemeProvider } from "@mui/material";

function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default appWithTranslation(App, i18nConfig);
