/**
 * refs:
 *  - https://github.com/PlasmoHQ/plasmo/blob/main/cli/plasmo/src/features/extension-devtools/generate-icons.ts
 *  - https://www.npmjs.com/package/canvas#loadimage
 */

const
  fs = require('fs'),
  { basename } = require("path"),
  { src, dest, series } = require('gulp'),
  change = require('gulp-change'),
  fabric = require('fabric').fabric,
  { createCanvas, loadImage } = require('canvas'),
  del = require('del');

const { getCommonPath } = require('./utils/common-paths');
const { currentDirectory, sourceDirectory } = getCommonPath();

const CANVAS_HEIGHT = 96;
const CANVAS_WIDTH = 96;
const CANVAS_PADDING = 16;
const CANVAS_HEIGHT_PADDED = CANVAS_HEIGHT + (CANVAS_PADDING * 2);
const CANVAS_WIDTH_PADDED = CANVAS_WIDTH + (CANVAS_PADDING * 2);
const ICON_BG_TOP_CENTER_POSITION_PADDED = {
  id: 'icon-bg',
  originY: 'top',
  originX: 'center',
  top: CANVAS_PADDING,
  left: CANVAS_WIDTH_PADDED / 2
};
const ICON_BOTTOM_RIGHT_POSITION_PADDED = {
  id: 'icon-status', // this will be the group/path id inside generated svg
  originY: 'bottom',
  originX: 'right',
  top: CANVAS_HEIGHT_PADDED - CANVAS_PADDING,
  left: CANVAS_WIDTH_PADDED - CANVAS_PADDING
};
const ICON_BOTTOM_CENTER_POSITION = {
  id: 'icon-status', // this will be the group/path id inside generated svg
  originY: 'bottom',
  originX: 'center',
  top: CANVAS_HEIGHT,
  left: CANVAS_WIDTH / 2
};

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
  savePng(iconName, canvasCtx.toDataURL());
  // saveSvg(iconName, canvasCtx.toSVG());
  console.log('Saving...', iconName);
}

const clearIconsFolder = () => {
  return del([
    'src/icons/*'
  ]);
};

const assembleIcons = async (cb) => {

  const canvasContext = new fabric.StaticCanvas(null, {
    width: CANVAS_WIDTH_PADDED,
    height: CANVAS_HEIGHT_PADDED
  });

  const resetCanvas = () => {
    canvasContext.setDimensions({
      width: CANVAS_WIDTH_PADDED,
      height: CANVAS_HEIGHT_PADDED
    });
    canvasContext.clear();
  };

  const loadSvg = (relativePath, options) => {
    let fabricObjResolve;
    let fabricObjReject;

    fabric.loadSVGFromURL(`file://${ currentDirectory }/${ relativePath }`, (objects, opts) => {
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

  const assembleIcon = async (iconName, parts) => {

    // we clear canvas in order to reuse the same
    // canvasContext.clear();
    resetCanvas();

    let partsPromises = [];
    parts.forEach(part => {
      partsPromises.push(loadSvg(part.filepath, part.options));
    });

    await Promise.all(partsPromises)
      .then((images) => {
        images.forEach((oImg) => {
          canvasContext.add(oImg).renderAll();
        });
        saveFiles(iconName, canvasContext);
        // canvasContext.clear();
        resetCanvas();
      });

  };

  // light theme icons

  const iconLightOnline = assembleIcon('icon-light-online', [
    {
      filepath: 'images/parts/v2/bg-light.svg',
      options: ICON_BG_TOP_CENTER_POSITION_PADDED
    },
    {
      filepath: 'images/parts/v2/status-on.svg',
      options: ICON_BOTTOM_RIGHT_POSITION_PADDED
    }
  ]);

  const iconLightOffline = assembleIcon('icon-light-offline', [
    {
      filepath: 'images/parts/v2/bg-light.svg',
      options: ICON_BG_TOP_CENTER_POSITION_PADDED
    },
    {
      filepath: 'images/parts/v2/status-off.svg',
      options: ICON_BOTTOM_RIGHT_POSITION_PADDED
    }
  ]);

  const iconLightOnlineDisabled = assembleIcon('icon-light-online-disabled', [
    {
      filepath: 'images/parts/v2/bg-light.svg',
      options: ICON_BG_TOP_CENTER_POSITION_PADDED
    },
    {
      filepath: 'images/parts/v2/status-on-disabled.svg',
      options: ICON_BOTTOM_RIGHT_POSITION_PADDED
    }
  ]);

  const iconLightOfflineDisabled = assembleIcon('icon-light-offline-disabled', [
    {
      filepath: 'images/parts/v2/bg-light.svg',
      options: ICON_BG_TOP_CENTER_POSITION_PADDED
    },
    {
      filepath: 'images/parts/v2/status-off-disabled.svg',
      options: ICON_BOTTOM_RIGHT_POSITION_PADDED
    }
  ]);

  // dark theme icons

  const iconDarkOnline = assembleIcon('icon-dark-online', [
    {
      filepath: 'images/parts/v2/bg-dark.svg',
      options: ICON_BG_TOP_CENTER_POSITION_PADDED
    },
    {
      filepath: 'images/parts/v2/status-on.svg',
      options: ICON_BOTTOM_RIGHT_POSITION_PADDED
    }
  ]);

  const iconDarkOffline = assembleIcon('icon-dark-offline', [
    {
      filepath: 'images/parts/v2/bg-dark.svg',
      options: ICON_BG_TOP_CENTER_POSITION_PADDED
    },
    {
      filepath: 'images/parts/v2/status-off.svg',
      options: ICON_BOTTOM_RIGHT_POSITION_PADDED
    }
  ]);

  const iconDarkOnlineDisabled = assembleIcon('icon-dark-online-disabled', [
    {
      filepath: 'images/parts/v2/bg-dark.svg',
      options: ICON_BG_TOP_CENTER_POSITION_PADDED
    },
    {
      filepath: 'images/parts/v2/status-on-disabled.svg',
      options: ICON_BOTTOM_RIGHT_POSITION_PADDED
    }
  ]);

  const iconDarkOfflineDisabled = assembleIcon('icon-dark-offline-disabled', [
    {
      filepath: 'images/parts/v2/bg-dark.svg',
      options: ICON_BG_TOP_CENTER_POSITION_PADDED
    },
    {
      filepath: 'images/parts/v2/status-off-disabled.svg',
      options: ICON_BOTTOM_RIGHT_POSITION_PADDED
    }
  ]);

  return Promise.all([
    iconLightOnline,
    iconLightOffline,
    iconLightOnlineDisabled,
    iconLightOfflineDisabled,
    iconDarkOnline,
    iconDarkOffline,
    iconDarkOnlineDisabled,
    iconDarkOfflineDisabled
  ]).then(() => {
    console.log('All icons assembled');
  });
};

const resizeIcons = () => {
  function resizeIconImage(content) {
    [128, 48, 32, 16].map((width) => {
      console.log('generated: ' + width  + ' ' + this.fname);
      const filepath = sourceDirectory + '/icons/' + this.fname;

      loadImage(filepath)
        .then((image) => {
          const canvas = createCanvas(width, width);
          const ctx = canvas.getContext('2d')
          ctx.drawImage(image, 0, 0, width, width);
          savePng(`${ basename(this.fname, '.png') }-${ width }`, canvas.toDataURL());
        }).catch(err => {
          console.log('oh no!', err)
        });
    });
  }

  return src('src/icons/*.png')
    .pipe(change(resizeIconImage))
    .pipe(dest('src/icons'));
};


module.exports = {
  resizeIconsStub: async (
    iconName = "icon512.png"
  ) => {
    console.log(iconName);

    // const image512Path = resolve(assetsDirectory, iconName)

    // if (existsSync(image512Path)) {
      // vLog("Make sure generated assets directory exists")
      // await ensureDir(genAssetsDirectory)

      // // TODO: hash check the image512 to skip this routine
      // vLog(`${iconName} found, create resized icons in gen-assets`)
      // const { Image } = await import("image-js")

      // const image512 = await Image.load(image512Path)
      await Promise.all(
        [128, 48, 16].map((width) => {
          console.log('generated: ' + width);
          // image512
          //   .resize({ width })
          //   .save(resolve(genAssetsDirectory, `icon${width}.png`))
        })
      )
    // }
  },
  displayIconsStub: (cb) => {
    console.log('gulp default cb test');
    const {
      currentDirectory,
      rootDirectory,
      sourceDirectory,
      packageFilePath,
      imagesDirectory,
      buildDirectory
    } = getCommonPath();

    console.log('currentDirectory', currentDirectory);
    console.log('rootDirectory', rootDirectory);
    console.log('sourceDirectory', sourceDirectory);
    console.log('packageFilePath', packageFilePath);
    console.log('imagesDirectory', imagesDirectory);
    console.log('buildDirectory', buildDirectory);

    cb();
  },
  resizeIcons,
  assembleIcons: series(clearIconsFolder, assembleIcons)
}
