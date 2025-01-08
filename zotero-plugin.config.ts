import { defineConfig } from "zotero-plugin-scaffold"
import postCssPlugin from "esbuild-style-plugin"
import tailwind from "tailwindcss"
import autoprefixer from "autoprefixer"
import pkg from "./package.json"
import { auto } from "openai/_shims/registry.mjs"

export default defineConfig({
  source: ["src", "addon"],
  dist: "build",
  name: pkg.config.addonName,
  id: pkg.config.addonID,
  namespace: pkg.config.addonRef,
  updateURL: `https://github.com/{{owner}}/{{repo}}/releases/download/release/${pkg.version.includes("-") ? "update-beta.json" : "update.json"
    }`,
  xpiDownloadLink:
    "https://github.com/{{owner}}/{{repo}}/releases/download/v{{version}}/{{xpiName}}.xpi",

  build: {
    assets: ["addon/**/*.*"],
    define: {
      ...pkg.config,
      author: pkg.author,
      description: pkg.description,
      homepage: pkg.homepage,
      buildVersion: pkg.version,
      buildTime: "{{buildTime}}",
    },
    esbuildOptions: [
      {
        entryPoints: ["src/index.ts"],
        define: {
          __env__: `"${process.env.NODE_ENV}"`,
        },
        plugins: [
          postCssPlugin({
            postcss: {
              plugins: [tailwind(), autoprefixer()]
            },
          }),
        ],
        bundle: true,
        target: "firefox115",
        outfile: `build/addon/chrome/content/scripts/${pkg.config.addonRef}.js`,
      },
      {
        entryPoints: ["src/workers/*.*"],
        define: {
          __env__: `"${process.env.NODE_ENV}"`,
        },
        outdir: "build/addon/chrome/content/scripts",
        bundle: true,
        target: ["firefox115"],
      },
    ],
  },

  // If you need to see a more detailed log, uncomment the following line:
  // logLevel: "trace",
})