import mure from 'mure';
import * as d3 from 'd3';

// strap mure and d3 to the window for debugging console access
window.mure = mure;
window.d3 = d3;

import MainView from './MainView';
import { DocView, Toolbar, AppToolbar, NewFileDialog, updateImgColorFilters } from 'mure-ui';
import './style.scss';
updateImgColorFilters();

import gearIcon from './img/gear.svg';
import newFileIcon from './img/newFile.svg';
import uploadIcon from './img/upload.svg';

import demoSvgText from '!raw-loader!./demo.svg';

mure.loadUserLibraries = true;
mure.runUserScripts = true;

let opsMenu = [
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
      new NewFileDialog('svg', [
        {
          label: 'Width',
          attrs: {
            type: 'number',
            id: 'width',
            min: 1,
            value: 512
          }
        },
        {
          label: 'Height',
          attrs: {
            type: 'number',
            id: 'height',
            min: 1,
            value: 512
          }
        }
      ],
      newFileSpecs => {
        let newFileText = '<svg width="' + newFileSpecs.width + '" height="' + newFileSpecs.height + '"></svg>';
        let newBlob = new window.Blob([newFileText], { type: 'image/svg+xml' });
        newBlob.name = newFileSpecs.name;
        mure.uploadSvg(newBlob);
      }).render();
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

let mainView;
let docView;
let appMenu;
let fileOpsMenu;

function setup () {
  mainView = new MainView();
  mainView.render(d3.select('#mainView'));

  docView = new DocView(demoSvgText);
  docView.render(d3.select('#docView'));

  appMenu = new AppToolbar();
  appMenu.render(d3.select('#appMenu'));

  fileOpsMenu = new Toolbar(opsMenu);
  fileOpsMenu.render(d3.select('#fileOpsMenu'));
}
window.onload = window.onresize = setup;
