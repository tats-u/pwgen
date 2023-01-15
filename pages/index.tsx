import Head from "next/head";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
// import styles from "../styles/Home.module.scss"
import { GetStaticProps } from "next";
import i18nConfig from "../next-i18n.config";
import { GeneratorSettings } from "../components/GeneratorSettings";
import { GeneratedPasswordList } from "../components/GeneratedPasswordList";
import { Stack } from "@mui/system";
import { createTheme } from "@mui/material";
import { useMemo } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { usePrefersDarkMode } from "../utils/darkMode";

export default function Home() {
  const prefersDarkMode = usePrefersDarkMode();
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? "dark" : "light",
        },
      }),
    [prefersDarkMode]
  );
  const { t } = useTranslation();

  return (
    <ThemeProvider theme={theme}>
      <div>
        <Head>
          <title>{t("title")}</title>
          {typeof t("description") === "string" && (
            <meta name="description" content={t("description") ?? undefined} />
          )}
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main>
          <h1>{t("title")}</h1>
          <Stack spacing="2em">
            <GeneratorSettings />
            <GeneratedPasswordList />
          </Stack>
        </main>
      </div>
    </ThemeProvider>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", ["common"], i18nConfig)),
  },
});
