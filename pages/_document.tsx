import { Html, Head, Main, NextScript } from "next/document";
import { useTranslation } from "next-i18next";

const Document = () => {
  const {
    i18n: { language },
  } = useTranslation();
  return (
    <Html lang={language}>
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
};

export default Document;
