import * as d3 from 'd3';
import View from '../lib/View';

import newFileDialogTemplate from './newFileDialog.html';

import './style.scss';

class Dialog extends View {
  constructor () {
    super();
    this.d3el = d3.select('body');
    this.dirty = true;
  }
  setup (d3el) {
    d3el.append('div')
      .classed('modalUnderlay', true);
    d3el.append('div')
      .classed('modalContainer', true)
      .append('div')
      .classed('modalBorder', true)
      .append('div')
      .classed('modal', true);
  }
  close (d3el) {
    d3el.selectAll('.modalUnderlay, .modalContainer').remove();
  }
}

class NewFileDialog extends Dialog {
  draw (d3el) {
    d3el.select('.modalBorder').styles({
      'width': '24em',
      'height': '18em',
      'left': 'calc(50% - 12em)',
      'top': 'calc(50% - 9em)'
    });

    let modal = d3el.select('.modal');
    modal.html(newFileDialogTemplate);

    let unitOptions = modal.selectAll('.units').selectAll('option')
      .data(NewFileDialog.UNITS);
    unitOptions.enter().append('option')
      .attr('value', d => d)
      .property('selected', d => d === 'px')
      .text(d => d);

    d3el.select('#okButton').on('click', () => {
      console.log('todo: create a file');
      this.close(d3el);
    });
    d3el.select('#cancelButton').on('click', () => {
      this.close(d3el);
    });
  }
}

NewFileDialog.UNITS = [
  'px',
  'em',
  'ex',
  'pt',
  'pc',
  'cm',
  'mm',
  'in'];

export { NewFileDialog };