import mure from './mure-library/mure.js';
import * as d3 from 'd3';

window.d3 = d3; // strap d3 to the window for debugging console access

import { NewFileDialog } from './Dialog';

import './style/layout.scss';
import './style/toolbars.scss';
import './style/scrollbars.scss';
import './lib/recolorImages.js';

import gearIcon from './img/gearIcon.svg';
import newFileIcon from './img/newFileIcon.svg';
import uploadIcon from './img/upload.svg';
import downloadIcon from './img/download.svg';
import openFileIcon from './img/openFileIcon.svg';
import trashCanIcon from './img/trashCanIcon.svg';

import demoSvgText from '!raw-loader!./demo.svg';
let demoBlob = new window.Blob([demoSvgText], { type: 'image/svg+xml' });

mure.loadUserLibraries = true;
mure.runUserScripts = true;

function renderMenu (menuId, menuData) {
  let menu = d3.select(menuId);
  let menuItems = menu.select('ul').selectAll('li').data(menuData);
  menuItems.exit().remove();
  let menuItemsEnter = menuItems.enter().append('li');
  let menuItemLinksEnter = menuItemsEnter.append('a');
  menuItemLinksEnter.append('img');
  menuItemsEnter.append('label');

  menuItems = menuItemsEnter.merge(menuItems);

  menuItems.classed('button', true)
    .classed('selected', d => d.selected);
  let menuItemLinks = menuItems.select('a');

  menuItemLinks.select('img').attr('src', d => d.icon);
  menuItems.select('label').text(d => d.label);

  menuItems.on('click', function (d) {
    d.onclick.call(this, d);
  });
}

function buildAppMenu () {
  return d3.entries(mure.apps).map(entry => {
    return {
      onclick: d => {
        mure.openApp(d.label);
      },
      label: entry.key,
      icon: require('./img/' + entry.value.icon),
      selected: entry.key === mure.currentApp
    };
  });
}

let fileOpsMenu = [
  {
    label: 'Settings',
    icon: gearIcon,
    onclick: () => {
      console.log('todo: settings dialog');
    }
  },
  {
    label: 'New File',
    icon: newFileIcon,
    onclick: () => {
      new NewFileDialog().render();
    }
  },
  {
    label: 'Upload',
    icon: uploadIcon,
    onclick: () => {
      let inputField = d3.select('body')
        .append('input')
        .attr('type', 'file')
        .property('multiple', true)
        .attr('accept', '.svg')
        .style('display', 'none')
        .on('change', () => {
          Array.from(inputField.node().files).forEach(fileObj => {
            mure.uploadSvg(fileObj);
          });
          inputField.remove();
        });
      inputField.node().click();
    }
  }
];

function renderUserFiles (fileList) {
  let allFiles = d3.select('#allFiles').selectAll('li')
    .data(fileList, d => d);
  allFiles.exit().remove();

  let allFilesEnter = allFiles.enter().append('li');
  allFilesEnter.append('span')
    .classed('fileTitle', true);

  allFiles = allFiles.merge(allFilesEnter);

  let openButtonsEnter = allFilesEnter.append('div')
    .classed('open', true)
    .classed('button', true);
  openButtonsEnter.append('a').append('img')
    .attr('src', openFileIcon);
  openButtonsEnter.append('label')
    .text('Open');
  let openButtons = allFiles.select('.open')
    .on('click', d => {
      mure.setCurrentFile(d).then(() => {
        mure.getFileList().then(renderUserFiles);
      });
    });
  mure.getCurrentFilename().then(currentFile => {
    openButtons.classed('selected', d => d === currentFile);
  });

  let downloadButtonsEnter = allFilesEnter.append('div')
    .classed('download', true)
    .classed('button', true);
  downloadButtonsEnter.append('a').append('img')
    .attr('src', downloadIcon);
  downloadButtonsEnter.append('label')
    .text('Download');
  allFiles.select('.download').on('click', d => {
    mure.downloadSvg(d);
  });

  let deleteButtonsEnter = allFilesEnter.append('div')
    .classed('delete', true)
    .classed('button', true);
  deleteButtonsEnter.append('a').append('img')
    .attr('src', trashCanIcon);
  deleteButtonsEnter.append('label')
    .text('Delete');

  allFiles.select('.fileTitle').text(d => d);
  allFiles.select('.delete').select('a').on('click', d => { mure.deleteSvg(d); });
}

function resizeIFrame () {
  let demo = d3.select('#demo');
  // CSS doesn't let us resize the iframe...
  let previewBounds = d3.select('#previewSection').node().getBoundingClientRect();
  let demoContent = demo.node().contentDocument.documentElement;
  let bounds = previewBounds;
  if (demoContent) {
    // First try to get width / height from the SVG tag's attributes
    bounds = {
      width: parseInt(demoContent.getAttribute('width')),
      height: parseInt(demoContent.getAttribute('height'))
    };
    if (isNaN(bounds.width) || isNaN(bounds.height)) {
      // Next, try using the viewBox attribute
      let viewBox = demoContent.getAttribute('viewBox');
      if (viewBox) {
        viewBox = viewBox.split(/\s/);
        bounds = {
          width: parseInt(viewBox[2]),
          height: parseInt(viewBox[3])
        };
      }
    }
    if (isNaN(bounds.width) || isNaN(bounds.height)) {
      // Finally, just resort to however large the browser renders it natively
      bounds = demoContent.getBoundingClientRect();
    }
  }
  demo.attrs({
    width: bounds.width,
    height: bounds.height
  });
  // While we're at it, might as well do some centering that CSS can't handle:
  let leftRightMargin = bounds.width < previewBounds.width ? 'auto' : null;
  let topBottomMargin = bounds.height < previewBounds.height ? 'auto' : null;
  demo.styles({
    'margin-left': leftRightMargin,
    'margin-right': leftRightMargin,
    'margin-top': topBottomMargin,
    'margin-bottom': topBottomMargin
  });
}

function renderFile (currentFileBlob) {
  currentFileBlob = currentFileBlob || demoBlob;
  let demo = d3.select('#demo');
  demo.attr('src', window.URL.createObjectURL(currentFileBlob));
  demo.node().focus();
}

function setup () {
  d3.select('#demo')
    .on('load', resizeIFrame);
  renderMenu('#appMenu', buildAppMenu());
  renderMenu('#fileOpsMenu', fileOpsMenu);
  mure.getFileList().then(renderUserFiles);
  mure.on('fileListChange', renderUserFiles);
  mure.on('fileChange', renderFile);
  mure.getCurrentFilename().then(filename => {
    mure.getFile(filename).then(renderFile);
  });
}
window.onload = window.onresize = setup;
