/**
 * refs:
 *  - https://github.com/cristianfromagio/bookmarklets
 *  - https://thewebdev.info/2022/02/26/how-to-save-a-base64-encoded-image-to-disk-with-node-js/
 *  - https://gist.github.com/carlynorama/c29ef418130da85114c89cbf4e8c399f
 *  - https://codingsans.com/blog/fabricjs-tutorial
 *  - http://fabricjs.com/fabric-intro-part-1#objects
 *  - http://fabricjs.com/fabric-intro-part-4#node
 *  - http://fabricjs.com/docs/fabric.StaticCanvas.html
 *  - https://stackoverflow.com/a/57747145 / https://stackoverflow.com/a/57928918
 *  - https://stackoverflow.com/questions/47198295/fabric-js-wait-until-loadedsvgfromstring-has-finished-before-rendering-group
 *  - http://www.independent-software.com/loading-an-svg-image-with-fabric-js.html
 *  - https://blog.streamelements.com/building-a-product-design-editor-4fe7750bbea3
 *  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
 *  - https://github.com/PoliteJS/gulp-change
 *  - https://techsparx.com/nodejs/graphics/svg-to-png.html
 *  - https://github.com/svg/svgo/blob/main/plugins/removeAttrs.js
 *  - https://github.com/ben-eb/gulp-svgmin/issues/125#issuecomment-1026938305
 *  - https://gulpjs.com/docs/en/api/concepts/#glob-base
 *  - https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/
 *  - https://stackabuse.com/executing-shell-commands-with-node-js/
 *  - http://fabricjs.com/test/misc/origin.html
 *  - https://stackoverflow.com/a/54706735
 *  - https://github.com/matatk/landmarks/issues/186#issuecomment-619380506 (icon contrast)
 *  - https://github.com/PlasmoHQ/plasmo/blob/main/cli/plasmo/src/features/extension-devtools/generate-icons.ts
 *  - https://www.stanleyulili.com/node/node-modules-import-and-use-functions-from-another-file/
 *  - https://github.com/sindresorhus/gulp-imagemin/issues/366#issuecomment-1038400682
 *  -
 */

const
  { exec, execSync, spawn } = require("child_process"),
  { src, dest, watch, series, parallel } = require('gulp'),
  del = require('del'),
  merge = require('merge-stream'),
  change = require('gulp-change'),
  svgmin = require('gulp-svgmin'),
  { DOMParser, XMLSerializer } = require('@xmldom/xmldom'),
  strip = require('gulp-strip-comments'),
  webExt = require('web-ext');

const {
  assembleIcons,
  resizeIcons,
  resizeIconsStub,
  displayIconsStub
} = require('./scripts/generate-icons');
const { getCommonPath } = require('./scripts/utils/common-paths');
const { buildDirectory } = getCommonPath();

const DEST_FOLDER = "dist";

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function optimizeSvgIcons(cb) {

  return src('src/icons/*.svg')
    .pipe(svgmin({
      multipass: true,
      floatPrecision: 8,
      js2svg: { pretty: true, indent: 2 },
      full: true,
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              cleanupIDs: false,
              removeViewBox: false,
              moveElemsAttrsToGroup: false,
              moveGroupAttrsToElems: false,
              removeXMLNS: false,
              convertPathData: false,
            }
          }
        },
        'removeRasterImages',
        'cleanupListOfValues',
        'convertStyleToAttrs',
        'removeStyleElement',
        'removeScriptElement',
        'removeOffCanvasPaths',
        'sortAttrs',
        {
          name: "removeAttrs",
          params: {
            attrs: [
              // remove all attrs starting with "fill-" and "stroke"
              // (stroke should be converted to path on inkscape export)
              '(fill-.*|stroke.*)',
              // remove id attr from all elements where id starts with "circle" and "path" (mostly auto-generated ids)
              '*:id:circle.*|path.*',
              // remove opacity attr from all elements where opacity equals to "1" ("1" is the default value already)
              '*:opacity:1',
            ]
          }
        }
      ]
    }))
    .pipe(dest('src/icons'));
}

function adaptIconsFill() {

  function addFillPropertyToIcon(content) {
    let icon = new DOMParser().parseFromString(content, 'text/xml');
    let bgGroupPath = icon.getElementById('icon-bg');
    if (!bgGroupPath) {
        throw new Error(`No content found on SVG`);
    }
    bgGroupPath.setAttribute('fill', 'context-fill');

    return new XMLSerializer().serializeToString(icon);
  }

  return src('src/icons/*.svg')
    .pipe(change(addFillPropertyToIcon))
    .pipe(dest('src/icons'));

}

function listen(cb) {

  watch(
    ['./src/**/*'],
    { events: ['change'] },
    build
  );

  // exec('web-ext run --verbose -s "C:\\Users\\froma\\Development\\connectivity-triggered-tab-reload-firefox\\dist"', (error, stdout, stderr) => {
  //     if (error) {
  //         console.log(`error: ${error.message}`);
  //         return;
  //     }
  //     if (stderr) {
  //         console.log(`stderr: ${stderr}`);
  //         return;
  //     }
  //     console.log(`stdout: ${stdout}`);
  // });

  // const wext = spawn('web-ext', ['run', '-s', buildDirectory], { shell: true });

  // wext.stdout.on('data', (data) => {
  //   console.log(`stdout: ${data}`);
  // });

  // wext.stderr.on('data', (data) => {
  //   console.error(`stderr: ${data}`);
  //   cb();
  // });

  // wext.on('error', (error) => {
  //   console.log(`error: ${error.message}`);
  //   cb();
  // });

  // wext.on('close', (code) => {
  //   console.log(`child process exited with code ${code}`);
  //   cb();
  // });

}

async function build() {

  await del(['dist/**/*']);

  const filesToCopy = [
    "src/_locales/**/*",
    "src/icons/icon-*-16.png",
    "src/icons/icon-*-32.png",
    "src/icons/icon-*-48.png",
    "src/icons/icon-*-128.png",
    "src/vendor/browser-polyfill.min.js",
    "src/background.js",
    "src/manifest.json",
  ];

  return src(filesToCopy, { base: 'src'}).pipe(dest(DEST_FOLDER));

}

let download = async function(filename, uri) {
  // "-o" outputs response to a file
  // "-L" follows redirects
  let command = `curl -o ${filename} -L ${uri}`;
  execSync(command);
};

async function downloadPolyfill() {
  return await download('src/vendor/browser-polyfill.min.js', 'https://unpkg.com/webextension-polyfill@latest/dist/browser-polyfill.min.js')
}

async function stripCommentsForBundle() {
  await sleep(500);
  return src(DEST_FOLDER + '/*.js').pipe(strip()).pipe(dest(DEST_FOLDER));
}

async function minimizeIconsForBundle() {
  await sleep(500);

  return import('gulp-imagemin').then((gulpImagemin) => {
		src(DEST_FOLDER + '/icons/*').pipe(
      gulpImagemin.default([
        gulpImagemin.optipng(),
      ]),
    ).pipe(dest(DEST_FOLDER + '/icons'));
	});
}

const devTasks = series(build, listen);
const generateIconsTasks = series(assembleIcons, resizeIcons);

module.exports = {
  'dev:icons-script': series(resizeIconsStub, displayIconsStub),
  'dev:resize-icons': resizeIcons,
  generateIcons: generateIconsTasks,
  generateIconsSvg: series(assembleIcons, optimizeSvgIcons, adaptIconsFill),
  build: build,
  listen: listen,
  polyfill: downloadPolyfill,
  bundle: series(parallel(generateIconsTasks, downloadPolyfill), build, stripCommentsForBundle, minimizeIconsForBundle),
  dev: devTasks,
  default: devTasks
}
