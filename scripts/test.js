const esbuild = require("esbuild")
const path = require("path")
const fs = require("fs")
const process = require("process")
const glob = require("tiny-glob")
// const replace = require("replace-in-file")
const { NodeGlobalsPolyfillPlugin } = require('@esbuild-plugins/node-globals-polyfill')
const { NodeModulesPolyfillPlugin } = require('@esbuild-plugins/node-modules-polyfill')

const { execSync } = require("child_process")
const { exit } = require("process")
const { exec } = require("./zotero-cmd.json")

const {
  name,
  author,
  description,
  homepage,
  version,
  config,
} = require("../package.json")

// function copyFileSync(source, target) {
//   var targetFile = target

//   // If target is a directory, a new file with the same name will be created
//   if (fs.existsSync(target)) {
//     if (fs.lstatSync(target).isDirectory()) {
//       targetFile = path.join(target, path.basename(source))
//     }
//   }

//   fs.writeFileSync(targetFile, fs.readFileSync(source))
// }

// function copyFolderRecursiveSync(source, target) {
//   var files = []

//   // Check if folder needs to be created or integrated
//   var targetFolder = path.join(target, path.basename(source))
//   if (!fs.existsSync(targetFolder)) {
//     fs.mkdirSync(targetFolder)
//   }

//   // Copy
//   if (fs.lstatSync(source).isDirectory()) {
//     files = fs.readdirSync(source)
//     files.forEach(function (file) {
//       var curSource = path.join(source, file)
//       if (fs.lstatSync(curSource).isDirectory()) {
//         copyFolderRecursiveSync(curSource, targetFolder)
//       } else {
//         copyFileSync(curSource, targetFolder)
//       }
//     })
//   }
// }

function clearFolder(target) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true })
  }

  fs.mkdirSync(target, { recursive: true })
}

function dateFormat(fmt, date) {
  let ret
  const opt = {
    "Y+": date.getFullYear().toString(),
    "m+": (date.getMonth() + 1).toString(),
    "d+": date.getDate().toString(),
    "H+": date.getHours().toString(),
    "M+": date.getMinutes().toString(),
    "S+": date.getSeconds().toString(),
  }
  for (let k in opt) {
    ret = new RegExp("(" + k + ")").exec(fmt)
    if (ret) {
      fmt = fmt.replace(
        ret[1],
        ret[1].length == 1 ? opt[k] : opt[k].padStart(ret[1].length, "0")
      )
    }
  }
  return fmt
}

async function main() {
  const t = new Date()
  const buildTime = dateFormat("YYYY-mm-dd HH:MM:SS", t)
  const buildDir = "tests"

  console.log(
    `[Test] BUILD_DIR=${buildDir}, VERSION=${version}, BUILD_TIME=${buildTime}, ENV=${[
      process.env.NODE_ENV,
    ]}`
  )

  clearFolder(buildDir)

  // copyFolderRecursiveSync("addon", buildDir)

  // copyFileSync("update-template.json", "update.json")
  // copyFileSync("update-template.rdf", "update.rdf")

  // const entryPoints = await glob("src/**/*.test.ts")

  await esbuild
    .build({
      entryPoints: ['src/tests.ts'],
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true,
          define: {
            'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`,
            'process.env.LANGCHAIN_TRACING': `"${process.env.NODE_ENV === 'development' ? 'true' : 'false'}"`,
          },
        }),
        NodeModulesPolyfillPlugin(),
      ],
      define: {
        global: '_globalThis',
        __env__: `"${process.env.NODE_ENV}"`,
      },
      bundle: true,
      platform: 'node',
      target: 'es2018',
      outfile: path.join(buildDir, "index.js"),
      // minify: true,
    })
    .catch(() => process.exit(1))

  console.log("[Test] Run esbuild OK")

  // const replaceFrom = [
  //   /__author__/g,
  //   /__description__/g,
  //   /__homepage__/g,
  //   /__buildVersion__/g,
  //   /__buildTime__/g,
  // ]

  // const replaceTo = [author, description, homepage, version, buildTime]

  // replaceFrom.push(
  //   ...Object.keys(config).map((k) => new RegExp(`__${k}__`, "g"))
  // )
  // replaceTo.push(...Object.values(config))

  // const optionsAddon = {
  //   files: [
  //     path.join(buildDir, "**/*.rdf"),
  //     path.join(buildDir, "**/*.dtd"),
  //     path.join(buildDir, "**/*.xul"),
  //     path.join(buildDir, "**/*.xhtml"),
  //     path.join(buildDir, "**/*.json"),
  //     path.join(buildDir, "addon/prefs.js"),
  //     path.join(buildDir, "addon/chrome.manifest"),
  //     path.join(buildDir, "addon/manifest.json"),
  //     path.join(buildDir, "addon/bootstrap.js"),
  //     "update.json",
  //     "update.rdf",
  //   ],
  //   from: replaceFrom,
  //   to: replaceTo,
  //   countMatches: true,
  // }

  // _ = replace.sync(optionsAddon)
  // console.log(
  //   "[Test] Run replace in ",
  //   _.filter((f) => f.hasChanged).map(
  //     (f) => `${f.file} : ${f.numReplacements} / ${f.numMatches}`
  //   )
  // )

  console.log("[Test] Addon pack OK")
  console.log(
    `[Test] Finished in ${(new Date().getTime() - t.getTime()) / 1000} s.`
  )

  const zoteroPath = exec[Object.keys(exec)[0]]

  const testFilePath = path.join(__dirname, '..', buildDir, 'index.js')
  const testZotero = `${zoteroPath} --debugger --purgecaches -url zotero://ztoolkit-debug/?file=${encodeURIComponent('file://' + testFilePath)}`
  console.log(testZotero)
  execSync(testZotero)
  exit(0)

}

main().catch((err) => {
  console.log(err)
  process.exit(1)
})
