import details from "../package.json" assert { type: "json" };
import {
  Logger,
  clearFolder,
  copyFileSync,
  copyFolderRecursiveSync,
  dateFormat,
} from "./utils.mjs";
import { zip } from "compressing";
import { build } from "esbuild";
import { existsSync, readdirSync, renameSync } from "fs";
import path from "path";
import { env, exit } from "process";
import replaceInFile from "replace-in-file";

const { replaceInFileSync } = replaceInFile;

process.env.NODE_ENV =
  process.argv[2] === "production" ? "production" : "development";

const buildDir = "build";

const { name, author, description, homepage, version, config } = details;
const isPreRelease = version.includes("-");

function replaceString(buildTime) {
  const replaceFrom = [
    /__author__/g,
    /__description__/g,
    /__homepage__/g,
    /__buildVersion__/g,
    /__buildTime__/g,
  ];
  const replaceTo = [author, description, homepage, version, buildTime];

  config.updateURL = isPreRelease
    ? config.updateJSON.replace("update.json", "update-beta.json")
    : config.updateJSON;

  replaceFrom.push(
    ...Object.keys(config).map((k) => new RegExp(`__${k}__`, "g")),
  );
  replaceTo.push(...Object.values(config));

  const replaceResult = replaceInFileSync({
    files: [
      `${buildDir}/addon/**/*.xhtml`,
      `${buildDir}/addon/**/*.html`,
      `${buildDir}/addon/**/*.css`,
      `${buildDir}/addon/**/*.json`,
      `${buildDir}/addon/prefs.js`,
      `${buildDir}/addon/manifest.json`,
      `${buildDir}/addon/bootstrap.js`,
    ],
    from: replaceFrom,
    to: replaceTo,
    countMatches: true,
  });

  // Logger.debug(
  //     "[Build] Run replace in ",
  //     replaceResult.filter((f) => f.hasChanged).map((f) => `${f.file} : ${f.numReplacements} / ${f.numMatches}`),
  // );
}

function prepareLocaleFiles() {
  // Prefix Fluent messages in xhtml
  const MessagesInHTML = new Set();
  replaceInFileSync({
    files: [`${buildDir}/addon/**/*.xhtml`, `${buildDir}/addon/**/*.html`],
    processor: (input) => {
      const matchs = [...input.matchAll(/(data-l10n-id)="(\S*)"/g)];
      matchs.map((match) => {
        input = input.replace(
          match[0],
          `${match[1]}="${config.addonRef}-${match[2]}"`,
        );
        MessagesInHTML.add(match[2]);
      });
      return input;
    },
  });

  // Walk the sub folders of `build/addon/locale`
  const localesPath = path.join(buildDir, "addon/locale"),
    localeNames = readdirSync(localesPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

  for (const localeName of localeNames) {
    const localePath = path.join(localesPath, localeName);
    const ftlFiles = readdirSync(localePath, {
      withFileTypes: true,
    })
      .filter((dirent) => dirent.isFile())
      .map((dirent) => dirent.name);

    // rename *.ftl to addonRef-*.ftl
    for (const ftlFile of ftlFiles) {
      if (ftlFile.endsWith(".ftl")) {
        renameSync(
          path.join(localePath, ftlFile),
          path.join(localePath, `${config.addonRef}-${ftlFile}`),
        );
      }
    }

    // Prefix Fluent messages in each ftl
    const MessageInThisLang = new Set();
    replaceInFileSync({
      files: [`${buildDir}/addon/locale/${localeName}/*.ftl`],
      processor: (fltContent) => {
        const lines = fltContent.split("\n");
        const prefixedLines = lines.map((line) => {
          // https://regex101.com/r/lQ9x5p/1
          const match = line.match(
            /^(?<message>[a-zA-Z]\S*)([ ]*=[ ]*)(?<pattern>.*)$/m,
          );
          if (match) {
            MessageInThisLang.add(match.groups.message);
            return `${config.addonRef}-${line}`;
          } else {
            return line;
          }
        });
        return prefixedLines.join("\n");
      },
    });

    // If a message in xhtml but not in ftl of current language, log it
    MessagesInHTML.forEach((message) => {
      if (!MessageInThisLang.has(message)) {
        Logger.error(`[Build] ${message} don't exist in ${localeName}`);
      }
    });
  }
}

function prepareUpdateJson() {
  // If it is a pre-release, use update-beta.json
  if (!isPreRelease) {
    copyFileSync("scripts/update-template.json", "update.json");
  }
  if (existsSync("update-beta.json") || isPreRelease) {
    copyFileSync("scripts/update-template.json", "update-beta.json");
  }

  const updateLink =
    config.updateLink ?? isPreRelease
      ? `${config.releasePage}/download/v${version}/${name}.xpi`
      : `${config.releasePage}/latest/download/${name}.xpi`;

  const replaceResult = replaceInFileSync({
    files: [
      "update-beta.json",
      isPreRelease ? "pass" : "update.json",
      `${buildDir}/addon/manifest.json`,
    ],
    from: [
      /__addonID__/g,
      /__buildVersion__/g,
      /__updateLink__/g,
      /__updateURL__/g,
    ],
    to: [config.addonID, version, updateLink, config.updateURL],
    countMatches: true,
  });

  Logger.debug(
    `[Build] Prepare Update.json for ${isPreRelease
      ? "\u001b[31m Prerelease \u001b[0m"
      : "\u001b[32m Release \u001b[0m"
    }`,
    replaceResult
      .filter((f) => f.hasChanged)
      .map((f) => `${f.file} : ${f.numReplacements} / ${f.numMatches}`),
  );
}

export const esbuildOptions = {
  entryPoints: ["src/index.ts"],
  define: {
    global: '_globalThis',
    __env__: `"${env.NODE_ENV}"`,
  },
  plugins: [
    // NodeGlobalsPolyfillPlugin({
    //   process: true,
    //   buffer: true,
    //   define: {
    //     'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`,
    //     // 'process.env.LANGCHAIN_TRACING': `"${process.env.NODE_ENV === 'development' ? 'true' : 'false'}"`,
    //   },
    // }),
    // NodeModulesPolyfillPlugin(),
    postCssPlugin({
      postcss: {
        plugins: [tailwind(), autoprefixer()],
      },
    }),
  ],
  // external: ['react', 'react-dom'],
  bundle: true,
  // platform: 'node',
  // target: 'es2018',
  target: "firefox102",
  outfile: path.join(
    buildDir,
    `addon/chrome/content/scripts/${config.addonRef}.js`,
  ),
  // Don't turn minify on
  minify: env.NODE_ENV === "production",
};

export async function main() {
  const t = new Date();
  const buildTime = dateFormat("YYYY-mm-dd HH:MM:SS", new Date());

  Logger.info(
    `[Build] BUILD_DIR=${buildDir}, VERSION=${version}, BUILD_TIME=${buildTime}, ENV=${[
      env.NODE_ENV,
    ]}`,
  );

  clearFolder(buildDir);
  copyFolderRecursiveSync("addon", buildDir);

  Logger.debug("[Build] Replacing");
  replaceString(buildTime);

  Logger.debug("[Build] Preparing locale files");
  prepareLocaleFiles();

  Logger.debug("[Build] Running esbuild");
  await build(esbuildOptions);

  Logger.debug("[Build] Addon prepare OK");

  if (process.env.NODE_ENV === "production") {
    Logger.debug("[Build] Packing Addon");
    await zip.compressDir(
      path.join(buildDir, "addon"),
      path.join(buildDir, `${name}.xpi`),
      {
        ignoreBase: true,
      },
    );

    prepareUpdateJson();

    Logger.debug(
      `[Build] Finished in ${(new Date().getTime() - t.getTime()) / 1000} s.`,
    );
  }
}

if (process.env.NODE_ENV === "production") {
  main().catch((err) => {
    Logger.error(err);
    exit(1);
  });
}
