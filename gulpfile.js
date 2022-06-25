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
 *  -
 */

const
  fs = require('fs'),
  path = require('path'),
  { exec, execSync, spawn } = require("child_process"),
  { src, dest, watch, series } = require('gulp'),
  merge = require('merge-stream'),
  change = require('gulp-change'),
  fabric = require('fabric').fabric,
  svgmin = require('gulp-svgmin'),
  { DOMParser, XMLSerializer } = require('@xmldom/xmldom'),
  webExt = require('web-ext');

const DEST_FOLDER = "dist";
const CANVAS_HEIGHT = 96;
const CANVAS_WIDTH = 96;
const ICON_BOTTOM_RIGHT_POSITION = {
  id: 'icon-status', // this will be the group/path id inside generated svg
  originY: 'bottom',
  originX: 'right',
  top: CANVAS_HEIGHT,
  left: CANVAS_WIDTH
};
const ICON_BOTTOM_CENTER_POSITION = {
  id: 'icon-status', // this will be the group/path id inside generated svg
  originY: 'bottom',
  originX: 'center',
  top: CANVAS_HEIGHT,
  left: CANVAS_WIDTH / 2
};

function assembleIcons(cb) {

  function savePng(iconName, base64String) {
    const base64Data = base64String.replace(/^data:image\/png;base64,/, "");
    fs.writeFile('src/icons/' + iconName + '.png', base64Data, 'base64', (err) => {
      if (err) throw err;
      // console.log(iconName + ' PNG written!');
    });
  }

  function saveSvg(iconName, svgString) {
    fs.writeFile('src/icons/' + iconName + '.svg', svgString, (err) => {
      if (err) throw err;
      // console.log(iconName + ' SVG written!');
    });
  }

  function saveFiles(iconName, canvasCtx) {
    // savePng(iconName, canvasCtx.toDataURL());
    saveSvg(iconName, canvasCtx.toSVG());
  }

  const canvasContext = new fabric.StaticCanvas(null, { width: CANVAS_HEIGHT, height: CANVAS_WIDTH });

  const loadSvg = (relativePath, options) => {
    let fabricObjResolve;
    let fabricObjReject;

    fabric.loadSVGFromURL(`file://${__dirname}/${ relativePath }`, (objects, opts) => {
      let oSvg = fabric.util.groupSVGElements(objects, opts);

      if (options) {
        oSvg.set(options);
      }

      if (oSvg) {
        fabricObjResolve(oSvg);
      } else {
        fabricObjReject('Not loaded');
      }
    });

    return new Promise((resolve, reject) => {
      fabricObjResolve = resolve;
      fabricObjReject = reject;
    });
  };

  const assembleIcon = (iconName, parts) => {

    // we clear canvas in order to reuse the same
    canvasContext.clear();

    let partsPromises = [];
    parts.forEach(part => {
      partsPromises.push(loadSvg(part.filepath, part.options));
    });

    return Promise.all(partsPromises)
      .then((images) => {
        images.forEach((oImg) => {
          canvasContext.add(oImg).renderAll();
        });
        saveFiles(iconName, canvasContext);
        canvasContext.clear();
      });

  };

  const iconOnline = assembleIcon('icon-online-96', [
    {
      filepath: 'images/parts/v2/bg-light.svg',
      options: { id: 'icon-bg' }
    },
    {
      filepath: 'images/parts/v2/status-on.svg',
      options: ICON_BOTTOM_RIGHT_POSITION
    }
  ]);

  const iconOffline = assembleIcon('icon-offline-96', [
    {
      filepath: 'images/parts/v2/bg-light.svg',
      options: { id: 'icon-bg' }
    },
    {
      filepath: 'images/parts/v2/status-off.svg',
      options: ICON_BOTTOM_RIGHT_POSITION
    }
  ]);

  const iconOnlineDisabled = assembleIcon('icon-online-disabled-96', [
    {
      filepath: 'images/parts/v2/bg-light.svg',
      options: { id: 'icon-bg' }
    },
    {
      filepath: 'images/parts/v2/status-on-disabled.svg',
      options: ICON_BOTTOM_RIGHT_POSITION
    }
  ]);

  const iconOfflineDisabled = assembleIcon('icon-offline-disabled-96', [
    {
      filepath: 'images/parts/v2/bg-light.svg',
      options: { id: 'icon-bg' }
    },
    {
      filepath: 'images/parts/v2/status-off-disabled.svg',
      options: ICON_BOTTOM_RIGHT_POSITION
    }
  ]);

  return Promise.all([
    iconOnline,
    iconOffline,
    iconOnlineDisabled,
    iconOfflineDisabled
  ]).then(() => {
    console.log('All icons assembled');
  });
}

function optimizeIcons(cb) {

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

  const wext = spawn('web-ext', ['run', '-s', "C:\\Users\\froma\\Development\\connectivity-triggered-tab-reload-firefox\\dist"], { shell: true });

  wext.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  wext.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
    cb();
  });

  wext.on('error', (error) => {
    console.log(`error: ${error.message}`);
    cb();
  });

  wext.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    cb();
  });

}

function build() {

  const filesToCopy = [
    "src/_locales/en/messages.json",
    "src/_locales/pt/messages.json",
    "src/icons/icon-offline-96.svg",
    "src/icons/icon-offline-disabled-96.svg",
    "src/icons/icon-online-96.svg",
    "src/icons/icon-online-disabled-96.svg",
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

const devTasks = series(build, listen);

exports.generateIcons = series(assembleIcons, optimizeIcons, adaptIconsFill);
exports.build = build;
exports.listen = listen;
exports.polyfill = downloadPolyfill;
exports.bundle = series(downloadPolyfill, build);
exports.dev = devTasks;
exports.default = devTasks;
