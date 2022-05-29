import { createDate } from '../../helpers/date';
import { getText } from '../../helpers/lang';
import { Component } from '../../LIGHTER';
import Button from '../buttons/Button';
import Checkbox from '../forms/formComponents/Checkbox';
import CheckboxList from '../forms/formComponents/CheckboxList';
import TextInput from '../forms/formComponents/TextInput';
import './Table.scss';

// Attributes for data:
// - tableData: Array[Object]
// - hideTableHeader: Boolean,
// - fullWidth: Boolean,
// - emptyStateMsg: String,
// - rowClickFn: Function(e, rowData)
// - tableParams: Object { sortColumn, sortOrder, filterString, filterMatchCase, filterSelectors, showRowsAmount }
// - afterChange: Function({ id, sortColumn, sortOrder, filterString, filterMatchCase, filterSelectors, showRowsAmount })
// - showGroupSize: Number,
// - showStats: Boolean,
// - unsortable: Boolean, (makes all of the columns unsortable)
// - selectable: Boolean, (if true adds checkboxes column and maintains an array of selected data which can be retrieved by calling the getSelected method)
// - tools: Array[Object], (array order is the order of the 'selected' tool buttons, if this is set, the selectable switch is not needed)
//     {
//       id: String,
//       text: String, (button text)
//       disabled: Boolean,
//       clickFn: Function(e, selected(Array)), (when the selections have been made and button is clicked, this fn is fired)
//     }
// - showRowNumbers: Boolean/String ('hover' means that the row number is only shown on hover and 'small' is the small numbers all the time, true creates a new column)
// - filter: Boolean, (enable table filtering input)
// - filterHotkey: String, (single key to focus the filter input field)
// - tableStructure: Array[Object], [required] (array order is the order of the columns)
//     {
//       key: String, [required] (The key in tableData item/object),
//       heading: String, (Column heading)
//       minWidth: String, (CSS min-width)
//       maxWidth: String, (CSS max-width)
//       width: String, (CSS width)
//       class: Array[String]/String, (CSS class(es) for the column)
//       unsortable: Boolean, (If the column should not be sortable, default false)
//       doNotFilter: Boolean, (If the column data (cell) should be included in filter searches)
//       sort: String, (Can be either 'desc' or 'asc')
//       type: String, (Special parsing for a column data (eg. 'Date'), this is defined at _formatCellData)
//       actionFn: Function(e, rowData), (Requires type: 'Action', this is the click fn on the action button. Automatic true for unsortable and doNotFilter)
//       actionText: String, (Action button text. If this is omitted, the heading will be used)
//     }
//
// Different data types:
// - 'Date': Parses the Date object string to a readable format. It uses the default Beaconjs format.
// - 'Action': Adds an action button to the row. This should be used with the actionFn function, that gets the current row's data when the button is clicked.
class Table extends Component {
  constructor(data) {
    super(data);
    this.tableStructure = data.tableStructure;
    if (!this.tableStructure) {
      this.logger.error(
        'Table component needs to have a tableStructure attribute: Array of Objects ({key:String}).'
      );
      throw new Error('Call stack');
    }
    if (data.selectable === true || (data.tools && data.tools.length)) {
      this.tableStructure = [
        {
          key: '_rowSelection',
          heading: ' ',
          unsortable: true,
          doNotFilter: true,
        },
        ...this.tableStructure,
      ];
    }
    if (data.showRowNumbers === true) {
      this.tableStructure = [
        {
          key: '_rowNumber',
          heading: '#',
          unsortable: true,
          doNotFilter: true,
        },
        ...this.tableStructure,
      ];
    }
    this.groupMax = 0;
    if (data.showGroupSize) {
      this.groupMax =
        data.tableParams && data.tableParams.showRowsAmount
          ? data.tableParams.showRowsAmount
          : data.showGroupSize;
    }
    for (let i = 0; i < this.tableStructure.length; i++) {
      if (this.tableStructure[i].actionFn) {
        this.tableStructure[i].unsortable = true;
        this.tableStructure[i].doNotFilter = true;
      } else if (data.tableParams && data.tableParams.sortColumn && data.tableParams.sortOrder) {
        if (this.tableStructure[i].key === data.tableParams.sortColumn) {
          this.tableStructure[i].sort = data.tableParams.sortOrder;
        } else {
          delete this.tableStructure[i].sort;
        }
      }
      if (data.unsortable) {
        this.tableStructure[i].unsortable = true;
      }
    }
    this.tableData = data.tableData;
    this.allData = [...data.tableData];
    for (let i = 0; i < this.tableData.length; i++) {
      this.tableData[i]['_tableIndex'] = i;
      this.allData[i]['_tableIndex'] = i;
    }
    this.template = '<div class="table-wrapper"></div>';
    this.selected = [];
    this.toolsComp;
    this.tableComp;
    this.tableParams = {
      sortOrder: null,
      sortColumn: null,
      filterString: '',
      filterMatchCase: false,
      filterSelectors: [],
      showRowsAmount: this.groupMax,
    };
    this.statsComp;
    this.filterComp;
    this.filterString =
      data.tableParams && data.tableParams.filterString ? data.tableParams.filterString : '';
    this.filterCaretPos = null;
    this.filterKeys = [];
    this.filterSettingsOpen = false;
    this.filterSettingsComp;
    this.filterMatchCase =
      data.tableParams && data.tableParams.filterMatchCase
        ? data.tableParams.filterMatchCase
        : false;
    this.filterSelectors = this.tableStructure
      .filter((struct) => !struct.doNotFilter)
      .map((struct, index) => {
        struct.label = struct.heading;
        struct.selected =
          data.tableParams &&
          data.tableParams.filterSelectors &&
          data.tableParams.filterSelectors.length >= index + 1
            ? data.tableParams.filterSelectors[index]
            : true;
        if (struct.selected) this.filterKeys.push(struct.key);
        return struct;
      });
    this.largeAmountLimit = 500; // If the data set is larger than this, than the filter will only start after enter key is pressed
    window.addEventListener('keyup', this.keyUp);
  }

  erase = () => {
    window.removeEventListener('keyup', this.keyUp);
  };

  init = (data) => {
    this.tableData = data.tableData;
    this.allData = [...data.tableData];
    for (let i = 0; i < this.tableData.length; i++) {
      this.tableData[i]['_tableIndex'] = i;
      this.allData[i]['_tableIndex'] = i;
    }
  };

  paint = () => {
    this._filterData(true);
    this._drawFilter();
    this._drawStats();
    this._drawTools();

    const table = this._createTable();
    this.tableComp = this.addChild({ id: this.id + '-elem', template: table });
    this.tableComp.draw();
    this._addTableListeners();
  };

  _showStatsText = () => {
    let text = '';
    if (this.groupMax && this.groupMax < this.tableData.length) {
      if (this.tableData.length !== this.allData.length) {
        text = `${getText('showing')} ${Math.min(this.groupMax, this.tableData.length)} / ${
          this.tableData.length
        } (${getText('total').toLowerCase()} ${this.allData.length})`;
      } else {
        text =
          getText('showing') +
          ' ' +
          Math.min(this.groupMax, this.tableData.length) +
          ' / ' +
          this.allData.length;
      }
    } else {
      text =
        this.tableData.length === this.allData.length
          ? getText('total') + ' ' + this.allData.length
          : getText('showing') + ' ' + this.tableData.length + ' / ' + this.allData.length;
    }
    if (this.selected.length) {
      text += '\u00a0\u00a0\u00a0\u00a0';
      text += `(${getText('selected').toLowerCase()} ${this.selected.length})`;
    }
    return text;
  };

  _addTableListeners = () => {
    for (let i = 0; i < this.tableStructure.length; i++) {
      if (!this.tableStructure[i].unsortable) {
        const accSortElem = document.getElementById(
          this.tableStructure[i].key + '-accessibility-sort-button-' + this.id
        );
        if (accSortElem) {
          this.tableComp.addListener({
            id: this.tableStructure[i].key + '-sort-listener-acc-' + this.id,
            target: accSortElem,
            type: 'click',
            fn: this._changeSortFN,
          });
        }
        const headerSortElem = document.getElementById(
          this.tableStructure[i].key + '-sort-header-' + this.id
        );
        if (headerSortElem) {
          this.tableComp.addListener({
            id: this.tableStructure[i].key + '-sort-listener-' + this.id,
            target: headerSortElem,
            type: 'click',
            fn: this._changeSortFN,
          });
        }
      }
      if (this.tableStructure[i].actionFn) {
        this.tableComp.addListener({
          id: this.id + '-action-click-' + this.tableStructure[i].key,
          type: 'click',
          fn: (e) => {
            const targetId = e.target.id;
            const buttonId = this.id + '-actionFn-' + this.tableStructure[i].key;
            if (targetId !== buttonId) return;
            let node = e.target,
              counter = 0,
              id,
              whileSwitch = true;
            while (whileSwitch) {
              if (node.localName.toLowerCase() === 'tr') {
                id = node.id;
                break;
              }
              node = node.parentElement;
              if (!node) break;
              if (counter > 100) break;
              counter++;
            }
            if (id && id.split('-')[0] === 'rowindex') {
              this.tableStructure[i].actionFn(e, this.tableData[id.split('-')[1]]);
            }
            return true;
          },
        });
      }
    }
    if (this.data.rowClickFn) {
      this.tableComp.addListener({
        id: this.id + '-row-click',
        type: 'click',
        fn: (e) => {
          if (
            e.target.id.includes(this.id + '-actionFn-') ||
            e.target.id.includes('-inputSelectorBox-') ||
            e.target.classList.contains('selection-box')
          )
            return;
          let node = e.target,
            counter = 0,
            id,
            whileSwitch = true;
          while (whileSwitch) {
            if (node.localName.toLowerCase() === 'tr') {
              id = node.id;
              break;
            }
            node = node.parentElement;
            if (!node) break;
            if (counter > 100) break;
            counter++;
          }
          if (id && id.split('-')[0] === 'rowindex') {
            this.data.rowClickFn(e, this.tableData[id.split('-')[1]]);
          }
        },
      });
    }
    if (this.data.selectable === true || (this.data.tools && this.data.tools.length)) {
      this.tableComp.addListener({
        id: this.id + '-row-selection-click',
        type: 'click',
        fn: (e) => {
          if (!e.target.id.includes('-inputSelectorBox-')) return;
          if (e.target.id.includes('-header-inputSelectorBox-')) {
            if (e.target.checked) {
              this.selected = [];
              if (this.groupMax) {
                const count = Math.min(this.groupMax, this.tableData.length);
                for (let i = 0; i < count; i++) {
                  this.selected.push(this.tableData[i]._tableIndex);
                }
              } else {
                for (let i = 0; i < this.tableData.length; i++) {
                  this.selected.push(this.tableData[i]._tableIndex);
                }
              }
            } else {
              this.selected = [];
            }
            this._refreshView();
            return;
          }
          let node = e.target,
            counter = 0,
            id,
            whileSwitch = true;
          while (whileSwitch) {
            if (node.localName.toLowerCase() === 'tr') {
              id = node.id;
              break;
            }
            node = node.parentElement;
            if (!node) break;
            if (counter > 100) break;
            counter++;
          }
          if (id && id.split('-')[0] === 'rowindex') {
            const index = this.tableData[id.split('-')[1]]._tableIndex;
            if (this.selected.includes(index)) {
              node.classList.remove('row-selection--selected');
              this.selected = this.selected.filter((item) => item !== index);
            } else {
              node.classList.add('row-selection--selected');
              this.selected.push(index);
            }
            const thElem = this.elem.querySelector('th.row-selection .selection-box');
            if (this.selected.length === 0) {
              thElem.classList.remove('selection-box--all');
              thElem.classList.remove('selection-box--some');
              thElem.querySelector('input').checked = false;
            } else if (this.groupMax) {
              if (
                this.selected.length === this.groupMax ||
                this.selected.length === this.tableData.length
              ) {
                thElem.classList.add('selection-box--all');
                thElem.classList.remove('selection-box--some');
                thElem.querySelector('input').checked = true;
              } else {
                thElem.classList.remove('selection-box--all');
                thElem.classList.add('selection-box--some');
                thElem.querySelector('input').checked = false;
              }
            } else {
              if (this.selected.length === this.tableData.length) {
                thElem.classList.add('selection-box--all');
                thElem.classList.remove('selection-box--some');
                thElem.querySelector('input').checked = true;
              } else {
                thElem.classList.remove('selection-box--all');
                thElem.classList.add('selection-box--some');
                thElem.querySelector('input').checked = false;
              }
            }
          }
          const statsElem = this.elem.querySelector('#' + this.id + '-stats');
          statsElem.innerText = this._showStatsText();
        },
      });
    }
    if (this.groupMax && this.groupMax < this.tableData.length) {
      this.tableComp.addListener({
        id: this.id + '-show-more-click',
        target: this.elem.querySelector('#' + this.id + '-show-more-button'),
        type: 'click',
        fn: () => {
          this.groupMax += this.data.showGroupSize;
          if (this.groupMax > this.allData.length) this.groupMax = this.allData.length;
          this._refreshView();
        },
      });
      this.tableComp.addListener({
        id: this.id + '-show-all-click',
        target: this.elem.querySelector('#' + this.id + '-show-all-button'),
        type: 'click',
        fn: () => {
          this.groupMax = this.allData.length;
          this._refreshView();
        },
      });
    }
  };

  _changeSortFN = (e) => {
    const id = e.target.id;
    const targetKey = id.split('-')[0];
    let curDir = 'desc',
      newSortSet = false;
    for (let i = 0; i < this.tableStructure.length; i++) {
      if (this.tableStructure[i].sort && targetKey !== this.tableStructure[i].key) {
        curDir = this.tableStructure[i].sort;
        this.tableStructure[i].sort = null;
        break;
      } else if (this.tableStructure[i].sort && targetKey === this.tableStructure[i].key) {
        // Only changing the sort direction, not the column
        this.tableStructure[i].sort === 'desc'
          ? (this.tableStructure[i].sort = 'asc')
          : (this.tableStructure[i].sort = 'desc');
        newSortSet = true;
        break;
      }
    }
    if (!newSortSet) {
      for (let i = 0; i < this.tableStructure.length; i++) {
        if (targetKey === this.tableStructure[i].key) {
          this.tableStructure[i].sort = curDir;
          break;
        }
      }
    }
    this.filterCaretPos = null;
    this._refreshView();
  };

  _refreshView = (hard) => {
    const scrollPosX = window.pageXOffset;
    const scrollPosY = window.pageYOffset;
    if (this.data.showStats) this.statsComp.discard(true);
    if (this.data.filter) this.filterComp.discard(true);
    this.tableComp.discard(true);
    if (this.toolsComp) this.toolsComp.discard(true);
    if (hard) {
      this.discard(true);
      this.reDrawSelf();
    } else {
      this.rePaint();
    }
    window.scrollTo(scrollPosX, scrollPosY);
    this.afterChange();
  };

  _createTable = () =>
    '<table class="table-compo"' +
    (this.data.fullWidth ? ' style="width:100%;"' : '') +
    '>' +
    this._createTableHeader() +
    this._createDataRows() +
    this._createShowMore() +
    '</table>';

  _createShowMore = () => {
    if (!this.groupMax || this.groupMax >= this.tableData.length) return '';
    const showMoreAmount = Math.min(this.data.showGroupSize, this.tableData.length - this.groupMax);
    return `<tr class="table-show-more-row">
            <td colspan="${this.tableStructure.length}">
                <button id="${this.id}-show-more-button" class="table-show-more">Show more (${showMoreAmount})</button>
                <button id="${this.id}-show-all-button" class="table-show-all">Show all (${this.tableData.length})</button>
            </td>
        </tr>`;
  };

  _createDataRows = () => {
    if (!this.tableData.length) {
      return this._emptyState();
    }
    let rows = '',
      sortByKey = '',
      asc = false;
    for (let i = 0; i < this.tableStructure.length; i++) {
      if (this.tableStructure[i].sort) {
        sortByKey = this.tableStructure[i].key;
        if (this.tableStructure[i].sort === 'asc') asc = true;
        break;
      }
    }
    if (!sortByKey) {
      this.logger.error('Sorting key missing in table structure.', this.id);
      throw new Error('Call stack');
    }
    this.tableData.sort(this._sortCompare(sortByKey, asc));
    let selectionsFound = 0;
    for (let i = 0; i < this.tableData.length; i++) {
      if (this.groupMax && i + 1 > this.groupMax) break;
      rows += `<tr${this._createDataRowClass(this.tableData[i]._tableIndex)} id="rowindex-${i}-${
        this.id
      }">`;
      for (let j = 0; j < this.tableStructure.length; j++) {
        rows +=
          '<td' +
          this._createCellClasses(this.tableStructure[j]) +
          this._createCellStyle(this.tableStructure[j]) +
          '>';
        (rows += this._rowNumberOnHover(i, j)),
          (rows += this._formatCellData(this._getCellData(i, j), j));
        rows += '</td>';
      }
      rows += '</tr>';
      if (this.selected.includes(this.tableData[i]._tableIndex)) selectionsFound++;
      if (this.groupMax && i + 2 > this.groupMax && selectionsFound !== this.selected.length) {
        this.groupMax++;
      }
    }
    return `<tbody>${rows}</tbody>`;
  };

  _createDataRowClass = (index) => {
    let classString;
    if (this.data.rowClickFn) classString = 'table-row-clickable';
    if (this.selected.includes(index)) {
      if (classString && classString.length) {
        classString += ' row-selection--selected';
      } else {
        classString = 'row-selection--selected';
      }
    }
    return classString ? ` class="${classString}"` : '';
  };

  _getCellData = (tableIndex, structIndex) => {
    const row = this.tableData[tableIndex];
    const key = this.tableStructure[structIndex].key;
    if (key === '_rowNumber') {
      return tableIndex + 1;
    } else if (key === '_rowSelection') {
      return this._selectRowCheckbox(this.tableData[tableIndex]._tableIndex);
    }
    if (key.includes('.')) {
      const splitKey = key.split('.');
      let pos = row;
      for (let i = 0; i < splitKey.length; i++) {
        pos = pos[splitKey[i]];
        if (!pos) return '';
      }
      return pos;
    } else {
      return row[key];
    }
  };

  _createTableHeader = () => {
    if (this.data.hideTableHeader) return '';
    let header = '<thead><tr>';
    for (let i = 0; i < this.tableStructure.length; i++) {
      header += '<th';
      if (!this.tableStructure[i].unsortable)
        header += ` id="${this.tableStructure[i].key}-sort-header-${this.id}"`;
      header +=
        this._createCellClasses(this.tableStructure[i], true) +
        this._createCellStyle(this.tableStructure[i]) +
        '>';
      header += this.tableStructure[i].heading
        ? this.tableStructure[i].heading
        : this.tableStructure[i].key;
      if (!this.tableStructure[i].unsortable) {
        header += `<button id="${this.tableStructure[i].key}-accessibility-sort-button-${this.id}" class="table-accessibility-sort">`;
        header += `${getText('sort_by')} ${this.tableStructure[i].heading}`;
        header += '</button>';
      } else if (this.tableStructure[i].key === '_rowSelection') {
        header += this._selectRowCheckbox(0, true);
      }
      header += '</th>';
    }
    header += '</tr></thead>';
    return header;
  };

  _createCellClasses = (structure, isHeader) => {
    let classes = structure.classes;
    let classString = '';
    if (typeof classes === 'string' || classes instanceof String) {
      if (structure.sort) classes += ' sort-column';
      classString = classes;
    } else {
      classes = [];
      if (structure.sort) classes.push('sort-column');
      let classList = '';
      for (let i = 0; i < classes.length; i++) {
        if (!classList.length) {
          classList = classes[i];
        } else {
          classList += ' ' + classes[i];
        }
      }
      classString = classList;
    }
    if (isHeader) {
      if (structure.unsortable) {
        classString += ' unsortable';
      } else {
        classString += ' sort-available';
      }
      if (structure.sort) {
        this.tableParams.sortColumn = structure.key;
        if (structure.sort === 'asc') {
          classString += ' sort-asc';
          this.tableParams.sortOrder = 'asc';
        } else {
          classString += ' sort-desc';
          this.tableParams.sortOrder = 'desc';
        }
      }
    }
    if (structure.key === '_row-number') {
      classString += classString.length ? ' ' : '';
      classString += 'row-number-column';
    }
    if (structure.actionFn) {
      classString += classString.length ? ' ' : '';
      classString += 'row-actionFn';
    }
    if (structure.key === '_rowSelection') {
      classString += classString.length ? ' ' : '';
      classString += 'row-selection';
    }
    return ' class="' + classString + '"';
  };

  _createCellStyle = (column) => {
    let styles = '';
    if (column.width) styles += 'width:' + column.width + ';';
    if (column.minWidth) styles += 'min-width:' + column.minWidth + ';';
    if (column.maxWidth) styles += 'max-width:' + column.maxWidth + ';';
    if (!styles.length) return '';
    return ' style="' + styles + '"';
  };

  _formatCellData = (value, structIndex) => {
    const type = this.tableStructure[structIndex].type;
    if (type) {
      if (type === 'Date') {
        if (!value || !value.length) return '';
        return createDate(value);
      } else if (type === 'Action') {
        const struct = this.tableStructure[structIndex];
        return `<button id="${this.id}-actionFn-${struct.key}" class="table-row-action-button">
                    ${struct.actionText ? struct.actionText : struct.heading}
                </button>`;
      }
    }

    return value;
  };

  _sortCompare(property, asc) {
    let dir = -1;
    if (asc) dir = 1;
    return (a, b) => {
      const splitProp = property.split('.');
      let aVal = a[splitProp[0]];
      let bVal = b[splitProp[0]];
      for (let i = 1; i < splitProp.length; i++) {
        if (aVal) aVal = aVal[splitProp[i]];
        if (bVal) bVal = bVal[splitProp[i]];
      }
      if (
        (typeof aVal === 'string' || aVal instanceof String) &&
        (typeof bVal === 'string' || bVal instanceof String)
      ) {
        if (aVal.toLowerCase() < bVal.toLowerCase()) return dir;
        if (aVal.toLowerCase() > bVal.toLowerCase()) return -1 * dir;
      } else {
        if (aVal < bVal) return dir;
        if (aVal > bVal) return -1 * dir;
      }
      return 0;
    };
  }

  _emptyState = () => {
    let oneRow = '<tr class="table-comp-empty-state">';
    oneRow += `<td colspan="${this.tableStructure.length}">`;
    oneRow += this.data.emptyStateMsg
      ? this.data.emptyStateMsg
      : getText('table_no_rows_empty_state_text');
    oneRow += '</td></tr>';
    return `<tbody>${oneRow}</tbody>`;
  };

  _rowNumberOnHover = (rowIndex, structIndex) => {
    if (
      (this.data.showRowNumbers !== 'hover' && this.data.showRowNumbers !== 'small') ||
      structIndex !== 0
    )
      return '';
    return `<span class="table-${this.data.showRowNumbers}-row-number"># ${rowIndex + 1}</span>`;
  };

  _drawTools = () => {
    if (!this.data.tools || !this.data.tools.length) return;

    this.toolsComp = this.addChild({ id: this.id + '-tools-wrapper', class: 'tools-wrapper' });
    for (let i = 0; i < this.data.tools.length; i++) {
      if (!this.data.tools[i].id) {
        this.logger.warn('Table tools should have an id defined', this.data.tools[i]);
      }
      this.toolsComp.addChild(
        new Button({
          id: this.id + '-' + this.data.tools[i].id,
          class: 'table-tools-button',
          text: this.data.tools[i].text,
          attributes: this.data.tools[i].disabled ? { disabled: '' } : {},
          click: (e) => {
            const selected = this.allData.filter((row) => this.selected.includes(row._tableIndex));
            this.data.tools[i].clickFn(e, selected);
          },
        })
      );
    }
    this.toolsComp.draw();
    this.toolsComp.drawChildren();
  };

  _drawStats = () => {
    if (!this.data.showStats) return;

    this.statsComp = this.addChild({
      id: this.id + '-stats',
      class: 'table-stats',
      text: this._showStatsText(),
    });
    this.statsComp.draw();
    this.elem.classList.add('table-has-stats');
  };

  _drawFilter = () => {
    if (!this.data.filter) return;

    this.filterComp = this.addChild({
      id: this.id + '-filter-wrapper',
      class: 'table-filter-wrapper',
    });
    if (this.filterString.length || (this.groupMax && this.groupMax > this.data.showGroupSize)) {
      this.filterComp.addChild(
        new Button({
          id: this.id + '-filter-clear',
          class: 'table-filter-clear',
          click: () => {
            this.filterString = '';
            this.filterCaretPos = null;
            this._closeFilterSettings();
            this._filterData();
          },
        })
      );
    }
    const input = new TextInput({
      id: this.id + '-filter-input',
      label: '',
      hideMsg: true,
      placeholder:
        getText('filter') +
        (this.data.filterHotkey ? ` [${this.data.filterHotkey.toUpperCase()}]` : ''),
      value: this.filterString,
      changeFn: (e) => {
        const val = e.target.value;
        if (this.filterString === val) return;
        this.filterString = val;
        this.filterCaretPos = e.target.selectionStart;
        if (this.allData.length < this.largeAmountLimit) {
          this._filterData();
        }
      },
    });
    this.filterComp.addChild(input);
    if (this.allData.length > this.largeAmountLimit) {
      this.filterComp.addChild({
        id: this.id + '-filter-info',
        class: 'table-filter-info',
        text: getText('press_enter_to_filter'),
      });
    }
    this.filterComp.addChild(
      new Button({
        id: this.id + '-filter-settings-button',
        class: 'table-filter-settings-button',
        text:
          this.filterSelectors.length === this.filterKeys.length
            ? getText('filtering_all_columns')
            : getText('filtering_some_columns'),
        click: () => {
          this.filterSettingsOpen = !this.filterSettingsOpen;
          if (this.filterSettingsOpen) {
            this.elem.classList.add('filter-settings-open');
            window.addEventListener('click', this._closeFilterSettings);
          } else {
            this.elem.classList.remove('filter-settings-open');
            window.removeEventListener('click', this._closeFilterSettings);
          }
        },
      })
    );
    this.filterSettingsComp = new Component({
      id: this.id + '-filter-settings',
      class: 'table-filter-settings',
    });
    this.filterSettingsComp.addChild(
      new Checkbox({
        id: this.id + '-filter-settings-case',
        class: 'filter-case-checkbox',
        label: getText('match_case'),
        hideMsg: true,
        value: this.filterMatchCase,
        changeFn: (e) => {
          this.filterMatchCase = e.target.checked;
          this.filterCaretPos = null;
          this._filterData();
        },
      })
    );
    this.filterSettingsComp.addChild(
      new CheckboxList({
        id: this.id + '-filter-settings-col-selector',
        label: getText('columns_to_filter'),
        selectors: this.filterSelectors,
        minSelections: 1,
        changeFn: (e, selectors) => {
          this.filterSelectors = selectors;
          this.filterKeys = [];
          for (let i = 0; i < selectors.length; i++) {
            if (selectors[i].selected) this.filterKeys.push(selectors[i].key);
          }
          this.filterCaretPos = null;
          this._filterData();
        },
      })
    );
    this.filterComp.addChild(this.filterSettingsComp);
    this.filterComp.draw();
    this.filterComp.drawChildren(true);

    if (this.filterSettingsOpen) this.elem.classList.add('filter-settings-open');
    if (this.filterCaretPos !== null) input.focus(this.filterCaretPos);
    this.elem.style.minHeight =
      (this.elem.querySelector('#' + this.id + '-filter-settings').offsetHeight + 62) / 10 + 'rem';
    this.elem.classList.add('table-has-filter');
  };

  _closeFilterSettings = (e) => {
    if (!e) {
      this.filterSettingsOpen = false;
      if (this.elem) this.elem.classList.remove('filter-settings-open');
      window.removeEventListener('click', this._closeFilterSettings);
      return;
    }
    const targetId = e.target.id;
    let node = e.target,
      counter = 0,
      whileSwitch = true;
    while (whileSwitch) {
      if (!node) node = document.getElementById(targetId);
      if (!node) return;
      const id = node.id;
      if (id === this.id + '-filter-settings' || id === this.id + '-filter-settings-button') {
        return;
      }
      if (node.localName.toLowerCase() === 'body') {
        this.filterSettingsOpen = false;
        if (this.elem) this.elem.classList.remove('filter-settings-open');
        window.removeEventListener('click', this._closeFilterSettings);
        return;
      }
      node = node.parentElement;
      counter++;
      if (counter > 100) {
        window.removeEventListener('click', this._closeFilterSettings);
        return;
      }
    }
  };

  _filterData = (noRefresh) => {
    if (this.filterString === '') {
      this.tableData = [...this.allData];
      this.groupMax = this.data.showGroupSize || 0;
      if (!noRefresh) this._refreshView();
      return;
    }

    const newData = [];
    let value;
    for (let i = 0; i < this.allData.length; i++) {
      const row = this.allData[i];
      for (let j = 0; j < this.filterKeys.length; j++) {
        const key = this.filterKeys[j];
        if (key.includes('.')) {
          const splitKey = key.split('.');
          let pos = row;
          for (let i = 0; i < splitKey.length; i++) {
            if (!pos) break;
            pos = pos[splitKey[i]];
            if (!pos) value = '';
          }
          value = pos;
        } else {
          value = row[key];
        }

        if (!value) continue;

        for (let k = 0; k < this.tableStructure.length; k++) {
          if (key === this.tableStructure[k].key) {
            value = this._formatCellData(value, k);
            break;
          }
        }

        // Filtering check
        if (this.filterMatchCase) {
          if (value && value.toString().includes(this.filterString)) {
            newData.push(this.allData[i]);
            break;
          }
        } else {
          if (value && value.toString().toLowerCase().includes(this.filterString.toLowerCase())) {
            newData.push(this.allData[i]);
            break;
          }
        }
      }
    }

    const addToNewData = [];
    const selectedArr = this.selected.map((sel) => {
      for (let i = 0; i < this.allData.length; i++) {
        if (this.allData[i]._tableIndex === sel) return this.allData[i];
      }
    });
    for (let i = 0; i < selectedArr.length; i++) {
      let itemFound = false;
      for (let j = 0; j < newData.length; j++) {
        if (newData[j]._tableIndex === selectedArr[i]._tableIndex) {
          itemFound = true;
          break;
        }
      }
      if (!itemFound) addToNewData.push(selectedArr[i]);
    }

    this.groupMax = this.data.showGroupSize || 0;
    this.tableData = newData.concat(addToNewData);
    if (!noRefresh) this._refreshView();
  };

  keyUp = (e) => {
    const targetId = e.target.id;
    const filterInputId = this.id + '-filter-input-input';
    if (targetId === filterInputId && e.key === 'Enter') {
      this._filterData();
      if (this.allData.length < this.largeAmountLimit) {
        this.elem.querySelector('#' + filterInputId).blur();
      }
    } else if (e.key === 'Escape') {
      this._closeFilterSettings();
      if (this.filterString === '' && this.filterCaretPos === null && e.target.id !== filterInputId)
        return;
      if (this.allData.length < this.largeAmountLimit) {
        this.filterString = '';
        this.filterCaretPos = null;
        this._filterData();
      }
      this.elem.querySelector('#' + filterInputId).blur();
    } else if (
      this.data.filter &&
      this.data.filterHotkey &&
      e.target.localName.toLowerCase() === 'body' &&
      e.key === this.data.filterHotkey
    ) {
      this.elem.querySelector('#' + filterInputId).focus();
    }
  };

  _selectRowCheckbox = (index, isHeader) => {
    let checked,
      headerClass = '';
    if (isHeader) {
      index = 'header';
      if (this.groupMax) {
        checked =
          this.groupMax === this.selected.length || this.selected.length === this.tableData.length
            ? 'checked'
            : '';
        headerClass =
          this.groupMax === this.selected.length || this.selected.length === this.tableData.length
            ? ' selection-box--all'
            : this.selected.length
            ? ' selection-box--some'
            : '';
      } else {
        checked = this.tableData.length === this.selected.length ? 'checked' : '';
        headerClass =
          this.tableData.length === this.selected.length
            ? ' selection-box--all'
            : this.selected.length
            ? ' selection-box--some'
            : '';
      }
    } else {
      checked = this.selected.includes(index) ? 'checked' : '';
    }
    return `<label for="selection-${index}-inputSelectorBox-${this.id}" class="selection-box${headerClass}">
            <input
                type="checkbox"
                name="selection-box-input-${index}-${this.id}"
                id="selection-${index}-inputSelectorBox-${this.id}"
                ${checked}
            />
        </label>`;
  };

  getSelected = () => this.allData.filter((item) => this.selected.includes(item._tableIndex));

  removeSelectedByTableIndex = (tableIndex) => {
    let removeIndex = null;
    for (let i = 0; i < this.selected.length; i++) {
      if (tableIndex === this.selected._tableIndex) {
        removeIndex = i;
        break;
      }
    }
    this.selected.splice(removeIndex, 1);
  };

  updateTable = (newData) => {
    this.data.tableData = newData;
    this.tableData = newData;
    this.allData = [...newData];
    for (let i = 0; i < newData.length; i++) {
      this.data.tableData[i]['_tableIndex'] = i;
      this.allData[i]['_tableIndex'] = i;
    }
    this._refreshView(true);
  };

  afterChange = () => {
    if (this.data.afterChange) {
      this.tableParams.filterString = this.filterString;
      this.tableParams.filterMatchCase = this.filterMatchCase;
      this.tableParams.filterSelectors = this.filterSelectors.map((s) => s.selected);
      this.tableParams.showRowsAmount = this.groupMax;
      this.data.afterChange(this.tableParams, this.data.id);
    }
  };
}

export default Table;
