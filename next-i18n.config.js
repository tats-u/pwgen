/** @type {import("next-i18next/dist/types/types.js").UserConfig} */
const i18nConfig = {
  debug: process.env.NODE_ENV === "development",
  i18n: {
    locales: ["en", "ja"],
    defaultLocale: "en",
  },

  reloadOnPrerender: process.env.NODE_ENV === "development",
  localeExtension: "yml",
};

export default i18nConfig;
