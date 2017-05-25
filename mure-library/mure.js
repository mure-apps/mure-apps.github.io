import PouchDB from 'pouchdb';
import apps from './apps.json';
import Model from '../lib/Model/index.js';

class Mure extends Model {
  constructor () {
    super();
    this.apps = apps;
    // Funky stuff to figure out if we're debugging (if that's the case, we want to use
    // localhost instead of the github link for all links)
    let windowTitle = document.getElementsByTagName('title')[0];
    windowTitle = windowTitle ? windowTitle.textContent : '';
    this.debugMode = window.location.hostname === 'localhost' && windowTitle.startsWith('Mure');
    // Once we know whether we're debugging, figure out the current app name
    this.currentApp = Object.keys(apps).filter(d => {
      if (this.debugMode) {
        return parseInt(window.location.port) === this.apps[d].debug_port;
      } else {
        return window.location.href.startsWith(this.apps[d].public_url);
      }
    })[0];
    // Create / load the local database of files
    this.db = new PouchDB('mure');

    this.loadUserLibraries = false;
    this.runUserScripts = false;

    // default error handling (apps can listen for / display error messages in addition to this):
    this.on('error', errorMessage => { console.warn(errorMessage); });
    this.catchDbError = errorObj => { this.trigger('error', 'Unexpected error reading PouchDB: ' + errorObj.message); };

    // in the absence of a custom prompt dialog box, just use window.prompt:
    this.prompt = window.prompt;
  }
  signalSvgLoaded (loadUserLibrariesFunc, runUserScriptsFunc) {
    // Only load the SVG's linked libraries + embedded scripts if we've been told to
    let callback = this.runUserScripts ? runUserScriptsFunc : () => {};
    if (this.loadUserLibraries) {
      loadUserLibrariesFunc(callback);
    }
    this.trigger('svgLoaded');
  }
  on (eventName, callback) {
    if (!Mure.VALID_EVENTS[eventName]) {
      throw new Error('Unknown event name: ' + eventName);
    } else {
      super.on(eventName, callback);
    }
  }
  customizeConfirmDialog (showDialogFunction) {
    this.prompt = showDialogFunction;
  }
  openApp (appName) {
    console.log('todo: switch to ' + this.apps[appName]);
  }
  getSvgBlob (filename) {
    return this.db.getAttachment(filename, filename)
      .catch(this.catchDbError);
  }
  saveSvgBlob (filename, blob) {
    let dbEntry = {
      _id: filename,
      _attachments: {}
    };
    dbEntry._attachments[filename] = {
      content_type: blob.type,
      data: blob
    };
    this.db.get(filename).then(existingDoc => {
      // the file exists... overwrite the document
      dbEntry._rev = existingDoc._rev;
      return this.db.put(dbEntry);
    }).catch(errorObj => {
      if (errorObj.message === 'missing') {
        // the file doesn't exist yet...
        return this.db.put(dbEntry).then(putResponse => {
          this.triggerFileListChange();
          return putResponse;
        });
      } else {
        this.catchDbError(errorObj);
      }
    });
  }
  getFileList () {
    return this.db.allDocs()
      .then(response => {
        return response.rows.map(d => d.id);
      }).catch(this.catchDbError);
  }
  triggerFileListChange () {
    return this.getFileList().then(fileList => {
      this.trigger('fileListChange', fileList);
    });
  }
  getFileRevisions () {
    return this.db.allDocs()
      .then(response => {
        let result = {};
        response.rows.forEach(d => {
          result[d.id] = d.value.rev;
        });
        return result;
      }).catch(this.catchDbError);
  }
  uploadSvg (fileObj) {
    let filename = fileObj.name;
    return this.getFileRevisions().then(revisionDict => {
      // Ask multiple times if the user happens to enter another filename that already exists
      while (revisionDict[filename]) {
        let newName = this.prompt(
          fileObj.name + ' already exists. Pick a new name, or leave it the same to overwrite:',
          fileObj.name);
        if (!newName) {
          return null;
        } else if (newName === filename) {
          return filename;
        } else {
          filename = newName;
        }
      }
      return filename;
    }).then(filename => {
      if (filename) {
        this.saveSvgBlob(filename, fileObj);
      }
    }).catch(this.catchDbError);
  }
  deleteSvg (filename) {
    this.db.get(filename).then(existingDoc => {
      return this.db.remove(existingDoc._id, existingDoc._rev)
        .then(removeResponse => {
          this.triggerFileListChange();
          return removeResponse;
        });
    }).catch(this.catchDbError);
  }
  downloadSvg (filename) {
    this.getSvgBlob(filename).then(blob => {
      // create a fake link...
      let a = document.createElement('a');
      a.style = 'display:none';
      let url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.parentNode.removeChild(a);
    }).catch(this.catchDbError);
  }
}

Mure.VALID_EVENTS = {
  fileListChange: true,
  error: true,
  svgLoaded: true
};

let mure = new Mure();
window.mure = mure;
export default mure;
