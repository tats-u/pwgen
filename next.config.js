import { createVanillaExtractPlugin } from "@vanilla-extract/next-plugin";
import i18nConfig from "./next-i18n.config.js";

const ghpagesRoot = "/pwgen";

/** @type {import('next').NextConfig} */
const nextConfigBase = {
  basePath: process.env.DEPLOY_ENV === "GH_PAGES" ? ghpagesRoot : "",
  reactStrictMode: true,
  swcMinify: true,
  i18n: i18nConfig.i18n,
  compiler: {
    emotion: true,
  },
  webpack: (config, _options) => {
    config.module.rules.push({
      test: /\.(yml|yaml)$/,
      use: [{ loader: "json-loader" }, { loader: "yaml-flat-loader" }],
    });
    return config;
  },
};

const nextConfig = createVanillaExtractPlugin()(nextConfigBase);

export default nextConfig;
