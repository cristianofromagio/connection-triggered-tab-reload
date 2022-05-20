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
 *  -
 */

const
  fs = require('fs'),
  { src, dest, watch, series } = require('gulp'),
  merge = require('merge-stream'),
  change = require('gulp-change'),
  fabric = require('fabric').fabric,
  svgmin = require('gulp-svgmin'),
  { DOMParser, XMLSerializer } = require('@xmldom/xmldom');

const CANVAS_HEIGHT = 96;
const CANVAS_WIDTH = 96;
const ICON_BOTTOM_RIGHT_POSITION = {
  id: 'icon-status', // this will be the group/path id inside generated svg
  originY: 'bottom',
  originX: 'right',
  top: CANVAS_HEIGHT,
  left: CANVAS_WIDTH
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

  const iconDarkDisabled = assembleIcon('dark-disabled-96', [
    {
      filepath: 'images/parts/bg-dark.svg',
      options: { id: 'icon-bg' }
    },
    {
      filepath: 'images/parts/corner-dark-disabled.svg',
      options: ICON_BOTTOM_RIGHT_POSITION
    }
  ]);

  const iconDarkOn = assembleIcon('dark-on-96', [
    {
      filepath: 'images/parts/bg-dark.svg',
      options: { id: 'icon-bg' }
    },
    {
      filepath: 'images/parts/corner-dark-on.svg',
      options: ICON_BOTTOM_RIGHT_POSITION
    }
  ]);

  const iconDarkOff = assembleIcon('dark-off-96', [
    {
      filepath: 'images/parts/bg-dark.svg',
      options: { id: 'icon-bg' }
    },
    {
      filepath: 'images/parts/corner-dark-off.svg',
      options: ICON_BOTTOM_RIGHT_POSITION
    }
  ]);

  const iconLightDisabled = assembleIcon('light-disabled-96', [
    {
      filepath: 'images/parts/bg-light.svg',
      options: { id: 'icon-bg' }
    },
    {
      filepath: 'images/parts/corner-light-disabled.svg',
      options: ICON_BOTTOM_RIGHT_POSITION
    }
  ]);

  const iconLightOn = assembleIcon('light-on-96', [
    {
      filepath: 'images/parts/bg-light.svg',
      options: { id: 'icon-bg' }
    },
    {
      filepath: 'images/parts/corner-light-on.svg',
      options: ICON_BOTTOM_RIGHT_POSITION
    }
  ]);

  const iconLightOff = assembleIcon('light-off-96', [
    {
      filepath: 'images/parts/bg-light.svg',
      options: { id: 'icon-bg' }
    },
    {
      filepath: 'images/parts/corner-light-off.svg',
      options: ICON_BOTTOM_RIGHT_POSITION
    }
  ]);

  return Promise.all([
    iconDarkDisabled,
    iconDarkOn,
    iconDarkOff,
    iconLightDisabled,
    iconLightOn,
    iconLightOff
  ]).then(() => {
    console.log('All icons assembled');
  });
}

function optimizeIcons(cb) {
  /**
    '--removeXMLNS',
    '--convertPathData',
    'removeViewBox', // find "convert width/height to viewbox"
    '--cleanupIDs', // this would remove svg groud ids (but we need them to set context-fill)
  */
  return src('src/icons/*.svg')
    .pipe(svgmin({
      multipass: true,
      floatPrecision: 8,
      js2svg: { pretty: true, indent: 2 },
      full: true,
      plugins: [
        'removeDoctype',
        'removeXMLProcInst',
        'removeComments',
        'removeMetadata',
        'removeEditorsNSData',
        'cleanupAttrs',
        'mergeStyles',
        'inlineStyles',
        'minifyStyles',
        'convertStyleToAttrs',
        'removeRasterImages',
        'removeUselessDefs',
        'cleanupNumericValues',
        'cleanupListOfValues',
        'convertColors',
        'removeUnknownsAndDefaults',
        'removeNonInheritableGroupAttrs',
        'removeUselessStrokeAndFill',
        'cleanupEnableBackground',
        'removeHiddenElems',
        'removeEmptyText',
        'convertShapeToPath',
        'convertEllipseToCircle',
        'moveGroupAttrsToElems',
        'collapseGroups',
        'convertTransform',
        'removeEmptyAttrs',
        'removeEmptyContainers',
        'mergePaths',
        'removeUnusedNS',
        'sortAttrs',
        'sortDefsChildren',
        'removeTitle',
        'removeDesc',
        'removeStyleElement',
        'removeScriptElement',
        'removeOffCanvasPaths',
        'reusePaths',
      ],
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

function listen() {
  watch(['./src/**/*'], {
    events: ['change']
  }, build);
}

function build() {}

function publish() {}


const devTasks = series(build, listen);

exports.generateIcons = series(assembleIcons, optimizeIcons, adaptIconsFill);
exports.publish = series(build, publish);
exports.build = build;
exports.dev = devTasks;
exports.default = devTasks;
