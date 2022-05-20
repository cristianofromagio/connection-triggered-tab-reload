/**
 * refs:
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
 *  -
 */

const
  fs = require('fs'),
  fabric = require('fabric').fabric;

const CANVAS_HEIGHT = 96;
const CANVAS_WIDTH = 96;
const BOTTOM_RIGHT_POSITION = {
  'originY': 'bottom',
  'originX': 'right',
  'top': CANVAS_HEIGHT,
  'left': CANVAS_WIDTH
};

const canvasContext = new fabric.StaticCanvas(null, { width: CANVAS_HEIGHT, height: CANVAS_WIDTH });

const loadSvg = (relativePath, options) => {
  let fabricObjResolve;
  let fabricObjReject;

  fabric.loadSVGFromURL(`file://${__dirname}/${ relativePath }`, (objects, opts) => {
    const oSvg = fabric.util.groupSVGElements(objects, opts);

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

const darkDisabled = assembleIcon('icon-dark-disabled', [
  {
    filepath: 'images/parts/bg-dark.svg',
    options: null
  },
  {
    filepath: 'images/parts/corner-dark-disabled.svg',
    options: BOTTOM_RIGHT_POSITION
  }
]);

const darkOn = assembleIcon('icon-dark-on', [
  {
    filepath: 'images/parts/bg-dark.svg',
    options: null
  },
  {
    filepath: 'images/parts/corner-dark-on.svg',
    options: BOTTOM_RIGHT_POSITION
  }
]);

const darkOff = assembleIcon('icon-dark-off', [
  {
    filepath: 'images/parts/bg-dark.svg',
    options: null
  },
  {
    filepath: 'images/parts/corner-dark-off.svg',
    options: BOTTOM_RIGHT_POSITION
  }
]);

const lightDisabled = assembleIcon('icon-light-disabled', [
  {
    filepath: 'images/parts/bg-light.svg',
    options: null
  },
  {
    filepath: 'images/parts/corner-light-disabled.svg',
    options: BOTTOM_RIGHT_POSITION
  }
]);

const lightOn = assembleIcon('icon-light-on', [
  {
    filepath: 'images/parts/bg-light.svg',
    options: null
  },
  {
    filepath: 'images/parts/corner-light-on.svg',
    options: BOTTOM_RIGHT_POSITION
  }
]);

const lightOff = assembleIcon('icon-light-off', [
  {
    filepath: 'images/parts/bg-light.svg',
    options: null
  },
  {
    filepath: 'images/parts/corner-light-off.svg',
    options: BOTTOM_RIGHT_POSITION
  }
]);

Promise.all([
  darkDisabled,
  darkOn,
  darkOff,
  lightDisabled,
  lightOn,
  lightOff,
]).then(() => {
  console.log('icons assembled');
});

function savePng(iconName, base64String) {
  const base64Data = base64String.replace(/^data:image\/png;base64,/, "");
  fs.writeFile('fabric-outputs/' + iconName + '.png', base64Data, 'base64', (err) => {
    if (err) throw err;
    console.log(iconName + ' PNG written!');
  });
}

function saveSvg(iconName, svgString) {
  fs.writeFile('fabric-outputs/' + iconName + '.svg', svgString, (err) => {
    if (err) throw err;
    console.log(iconName + ' SVG written!');
  });
}

function saveFiles(iconName, canvasCtx) {
  savePng(iconName, canvasCtx.toDataURL());
  saveSvg(iconName, canvasCtx.toSVG());
}
