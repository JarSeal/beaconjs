import gsap from 'gsap';
import { createDate } from '../../helpers/date';
import { getText } from '../../helpers/lang';
import { Component } from '../../LIGHTER';
import Button from '../buttons/Button';
import Checkbox from '../forms/formComponents/Checkbox';
import CheckboxList from '../forms/formComponents/CheckboxList';
import TextInput from '../forms/formComponents/TextInput';
import styles from './Table.module.scss';

// Attributes for data:
// - tableData: Array[Object] [required]
// - hideTableHeader: Boolean,
// - fullWidth: Boolean,
// - emptyStateMsg: String,
// - rowClickFn: Function(e, rowData)
// - tableParams: Object { sortColumn, ,sortOrder }
// - afterChange: Function({ id, sortColumn, sortOrder })
// - showStats: Boolean,
// - searchHotKey: String,
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
// - tableStructure: Array[Object], [required] (array order is the order of the columns)
//     {
//       key: String, [required] (The key in tableData item/object),
//       heading: String, (Column heading)
//       minWidth: String, (CSS min-width)
//       maxWidth: String, (CSS max-width)
//       width: String, (CSS width)
//       class: Array[String]/String, (CSS class(es) for the column)
//       unsortable: Boolean, (If the column should not be sortable, default false)
//       sort: String, (Can be either 'desc' or 'asc')
//       type: String, (Special parsing for a column data (eg. 'Date'), this is defined at _formatCellData)
//       actionFn: Function(e, rowData), (Requires type: 'Action', this is the click fn on the action button. Automatic true for unsortable)
//       actionText: String, (Action button text. If this is omitted, the heading will be used)
//     }
//
// Different data types:
// - 'Date': Parses the Date object string to a readable format. It uses the default Beaconjs format.
// - 'Action': Adds an action button to the row. This should be used with the actionFn function, that gets the current row's data when the button is clicked.
class TableWithSearch extends Component {
  constructor(data) {
    super(data);
    this.data.style = { position: 'relative' };
    this.data.class = styles.tableWithSearch;
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
        },
        ...this.tableStructure,
      ];
    }
    for (let i = 0; i < this.tableStructure.length; i++) {
      if (this.tableStructure[i].actionFn) {
        this.tableStructure[i].unsortable = true;
      } else if (data.tableParams?.sortBy && data.tableParams?.sortOr) {
        if (this.tableStructure[i].key === data.tableParams.sortBy) {
          this.tableStructure[i].sort = data.tableParams.sortOr;
        } else {
          delete this.tableStructure[i].sort;
        }
      }
      if (data.unsortable) {
        this.tableStructure[i].unsortable = true;
      }
    }
    this.tableData = data.tableData;
    this.totalCount = data.totalCount;
    for (let i = 0; i < this.tableData.length; i++) {
      this.tableData[i]['_tableIndex'] = i;
    }
    this.template = '<div class="tableWrapper"></div>';
    this.selected = [];
    this.toolsComp;
    this.tableComp;
    this.tableParams = {
      ...{
        sortOr: null,
        sortBy: null,
        itemsPerPage: 25,
        page: 1,
        search: '',
        searchFields: data.searchFields || '',
        caseSensitive: false,
      },
      ...data.tableParams,
    };
    this.previousSearch = '';
    this.searchOptionsOpen = false;
    this.searchOptionsId = 'table-search-options-' + this.id;
    this.statsComp;
  }

  init = (data) => {
    this.tableData = data.tableData;
    for (let i = 0; i < this.tableData.length; i++) {
      this.tableData[i]['_tableIndex'] = i;
    }
  };

  paint = () => {
    this._drawStats();
    this._drawTools();
    this._drawSearch();

    const table = this._createTable();
    this.tableComp = this.addChild({ id: this.id + '-elem', template: table });
    this.tableComp.draw();
    this._addTableListeners();
  };

  _showStatsText = () => {
    let text = getText('showing') + ' ' + this.tableData.length + ' / ' + this.totalCount;
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
            fn: this._changeSortFn,
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
            fn: this._changeSortFn,
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
            e.target.classList.contains(styles.selectionBox)
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
          if (
            id &&
            id.split('-')[0] === 'rowindex' &&
            !e.srcElement?.classList.contains(styles.rowSelection)
          ) {
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
              for (let i = 0; i < this.tableData.length; i++) {
                this.selected.push(this.tableData[i]._tableIndex);
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
              node.classList.remove(styles.rowSelectionSelected);
              this.selected = this.selected.filter((item) => item !== index);
            } else {
              node.classList.add(styles.rowSelectionSelected);
              this.selected.push(index);
            }
            const thElem = this.elem.querySelector(
              `th.${styles.rowSelection} .${styles.selectionBox}`
            );
            if (this.selected.length === 0) {
              thElem.classList.remove(styles.selectionBoxAll);
              thElem.classList.remove(styles.selectionBoxSome);
              thElem.querySelector('input').checked = false;
            } else if (this.groupMax) {
              if (this.selected.length === this.tableData.length) {
                thElem.classList.add(styles.selectionBoxAll);
                thElem.classList.remove(styles.selectionBoxSome);
                thElem.querySelector('input').checked = true;
              } else {
                thElem.classList.remove(styles.selectionBoxAll);
                thElem.classList.add(styles.selectionBoxSome);
                thElem.querySelector('input').checked = false;
              }
            } else {
              if (this.selected.length === this.tableData.length) {
                thElem.classList.add(styles.selectionBoxAll);
                thElem.classList.remove(styles.selectionBoxSome);
                thElem.querySelector('input').checked = true;
              } else {
                thElem.classList.remove(styles.selectionBoxAll);
                thElem.classList.add(styles.selectionBoxSome);
                thElem.querySelector('input').checked = false;
              }
            }
          }
          const statsElem = this.elem.querySelector('#' + this.id + '-stats');
          statsElem.innerText = this._showStatsText();
        },
      });
    }
  };

  _changeSortFn = (e) => {
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
    this.searchOptionsOpen = false;
    this._refreshView();
  };

  _refreshView = (hard, noAfterChange) => {
    const scrollPosX = window.pageXOffset;
    const scrollPosY = window.pageYOffset;
    if (this.data.showStats) this.statsComp.discard(true);
    this.tableComp.discard(true);
    if (this.toolsComp) this.toolsComp.discard(true);
    if (hard) {
      this.discard(true);
      this.reDrawSelf();
    } else {
      this.rePaint();
    }
    window.scrollTo(scrollPosX, scrollPosY);
    if (!noAfterChange) this.afterChange();
  };

  _createTable = () =>
    `<table class="${styles.tableCompo}"` +
    (this.data.fullWidth ? ' style="width:100%;"' : '') +
    '>' +
    this._createTableHeader() +
    this._createDataRows() +
    this._createPagination() +
    '</table>';

  _createPagination = () => {
    const totalPages = Math.ceil(this.totalCount / this.tableParams.itemsPerPage) || 1;
    let page = this.tableParams.page;
    if (page > totalPages) page = totalPages;
    let pageNumberButtons = `<li>
      <button class="paginationButton ${styles.arrowButton}" page="first"${
      page === 1 ? ' disabled' : ''
    }>&#171;</button>
    </li>
    <li>
      <button class="paginationButton ${styles.arrowButton}" page="prev"${
      page === 1 ? ' disabled' : ''
    }>&#8249;</button>
    </li>`;
    const shownPageNumbersCount = 5; // Must be an odd number
    const maxShownPageNumbersPerSide = (shownPageNumbersCount - 1) / 2;
    if (page > maxShownPageNumbersPerSide + 1) {
      pageNumberButtons += '<li>...</li>';
    }
    for (let i = 0; i < totalPages; i++) {
      const pageNumber = i + 1;
      if (
        pageNumber >= page - maxShownPageNumbersPerSide &&
        pageNumber <= page + maxShownPageNumbersPerSide
      ) {
        pageNumberButtons += `<li>
          <button class="paginationButton${
            page === pageNumber ? ` ${styles.current}` : ''
          }" page="${pageNumber}">${pageNumber}</button>
        </li>`;
      }
    }
    if (page + maxShownPageNumbersPerSide < totalPages) {
      pageNumberButtons += '<li>...</li>';
    }
    pageNumberButtons += `<li>
      <button class="paginationButton ${styles.arrowButton}" page="next"${
      page === totalPages ? ' disabled' : ''
    }>&#8250;</button>
    </li>
    <li>
      <button class="paginationButton ${styles.arrowButton}" page="last"${
      page === totalPages ? ' disabled' : ''
    }>&#187;</button>
    </li>`;
    this.addListener({
      id: 'pagination-button-listener-' + this.id,
      type: 'click',
      fn: (e) => {
        if (e.target.classList.contains('paginationButton')) {
          const pageNrClicked = e.target.getAttribute('page');
          const parsedPageNr = parseInt(pageNrClicked);
          if (parsedPageNr === page) return;
          if (pageNrClicked === 'first') {
            this.tableParams.page = 1;
          } else if (pageNrClicked === 'prev') {
            const prevPage = page - 1;
            this.tableParams.page = prevPage > 0 ? prevPage : 1;
          } else if (pageNrClicked === 'next') {
            const nextPage = page + 1;
            this.tableParams.page = nextPage <= totalPages ? nextPage : totalPages;
          } else if (pageNrClicked === 'last') {
            this.tableParams.page = totalPages;
          } else {
            this.tableParams.page =
              parsedPageNr <= totalPages && parsedPageNr > 0 ? parsedPageNr : 1;
          }
          this._refreshView();
        }
      },
    });
    this.addListenerAfterDraw({
      id: 'select-items-per-page-listener-' + this.id,
      targetId: 'select-items-per-page-' + this.id,
      type: 'change',
      fn: (e) => {
        const newValue = parseInt(e.target.value);
        if (newValue !== this.tableParams.itemsPerPage) {
          this.tableParams.itemsPerPage = newValue;
          this.tableParams.page = 1;
          this._refreshView();
        }
      },
    });
    return `<tr class="${styles.tableShowMoreRow}">
        <td colspan="${this.tableStructure.length}">
          <div class="${styles.pagination}">
            <span class="${styles.curPageNumber}">${page} / ${totalPages}</span>
            <ul>${pageNumberButtons}</ul>
            <div class="${styles.itemsPerPage}">
              <span>${getText('items_per_page')}:</span><br />
              <select id="select-items-per-page-${this.id}">
                <option${this.tableParams.itemsPerPage === 10 ? ' selected' : ''}>10</option>
                <option${this.tableParams.itemsPerPage === 25 ? ' selected' : ''}>25</option>
                <option${this.tableParams.itemsPerPage === 50 ? ' selected' : ''}>50</option>
                <option${this.tableParams.itemsPerPage === 100 ? ' selected' : ''}>100</option>
                <option${this.tableParams.itemsPerPage === 200 ? ' selected' : ''}>200</option>
              </select>
            </div>
          </div>
        </td>
    </tr>`;
  };

  _createDataRows = () => {
    if (!this.tableData.length) {
      return this._emptyState();
    }
    let rows = '',
      sortByKey = '';
    for (let i = 0; i < this.tableStructure.length; i++) {
      if (this.tableStructure[i].sort) {
        sortByKey = this.tableStructure[i].key;
        break;
      }
    }
    if (!sortByKey) {
      this.logger.error('Sorting key missing in table structure.', this.id);
      throw new Error('Call stack');
    }
    for (let i = 0; i < this.tableData.length; i++) {
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
    }
    return `<tbody>${rows}</tbody>`;
  };

  _createDataRowClass = (index) => {
    const classes = [];
    if (this.data.rowClickFn) classes.push(styles.tableRowClickable);
    if (this.selected.includes(index)) {
      classes.push(styles.rowSelectionSelected);
    }
    return classes.length ? ` class="${classes.join(' ')}"` : '';
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
        header += `<button id="${this.tableStructure[i].key}-accessibility-sort-button-${this.id}" class="${styles.tableAccessibilitySort}">`;
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
      if (structure.sort) classes += ` ${styles.sortColumn}`;
      classString = classes;
    } else {
      classes = [];
      if (structure.sort) classes.push(styles.sortColumn);
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
        classString += ` ${styles.unsortable}`;
      } else {
        classString += ` ${styles.sortAvailable}`;
      }
      if (structure.sort) {
        this.tableParams.sortBy = structure.key;
        if (structure.sort === 'asc') {
          classString += ` ${styles.sortAsc}`;
          this.tableParams.sortOr = 'asc';
        } else {
          classString += ` ${styles.sortDesc}`;
          this.tableParams.sortOr = 'desc';
        }
      }
    }
    if (structure.key === '_row-number') {
      classString += classString.length ? ' ' : '';
      classString += styles.rowNumberColumn;
    }
    if (structure.actionFn) {
      classString += classString.length ? ' ' : '';
      classString += styles.rowActionFn;
    }
    if (structure.key === '_rowSelection') {
      classString += classString.length ? ' ' : '';
      classString += styles.rowSelection;
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
        return `<button
          id="${this.id}-actionFn-${struct.key}"
          class="${styles.tableRowActionButton}"
        >
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
    let oneRow = `<tr class="${styles.tableCompEmptyState}">`;
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
    const rowNumberClass =
      this.data.showRowNumbers === 'hover' ? styles.tableHoverRowNumber : styles.tableShowRowNumber;
    return `<span class="${rowNumberClass}"># ${rowIndex + 1}</span>`;
  };

  _drawTools = () => {
    if (!this.data.tools || !this.data.tools.length) return;

    this.toolsComp = this.addChild({ id: this.id + '-tools-wrapper', class: styles.toolsWrapper });
    for (let i = 0; i < this.data.tools.length; i++) {
      if (!this.data.tools[i].id) {
        this.logger.warn('Table tools should have an id defined', this.data.tools[i]);
      }
      this.toolsComp.addChild(
        new Button({
          id: this.id + '-' + this.data.tools[i].id,
          class: styles.tableToolsButton,
          text: this.data.tools[i].text,
          attributes: this.data.tools[i].disabled ? { disabled: '' } : {},
          click: (e) => {
            const selected = this.tableData.filter((row) =>
              this.selected.includes(row._tableIndex)
            );
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
      class: styles.tableStats,
      text: this._showStatsText(),
    });
    this.statsComp.draw();
    this.elem.classList.add(styles.tableHasStats);
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
            ? ` ${styles.selectionBoxAll}`
            : this.selected.length
            ? ` ${styles.selectionBoxSome}`
            : '';
      } else {
        checked = this.tableData.length === this.selected.length ? 'checked' : '';
        headerClass =
          this.tableData.length === this.selected.length
            ? ` ${styles.selectionBoxAll}`
            : this.selected.length
            ? ` ${styles.selectionBoxSome}`
            : '';
      }
    } else {
      checked = this.selected.includes(index) ? 'checked' : '';
    }
    return `<label for="selection-${index}-inputSelectorBox-${this.id}" class="${styles.selectionBox}${headerClass}">
            <input
              type="checkbox"
              name="selection-box-input-${index}-${this.id}"
              id="selection-${index}-inputSelectorBox-${this.id}"
              ${checked}
            />
        </label>`;
  };

  getSelected = () => this.tableData.filter((item) => this.selected.includes(item._tableIndex));

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

  updateTable = (newData, noAfterChange) => {
    this.data.tableData = newData.tableData;
    this.data.totalCount = newData.totalCount;
    this.tableData = newData.tableData;
    this.totalCount = newData.totalCount;
    for (let i = 0; i < newData.length; i++) {
      this.data.tableData[i]['_tableIndex'] = i;
    }
    this._refreshView(true, noAfterChange);
  };

  afterChange = () => {
    if (this.data.afterChange) this.data.afterChange(this.tableParams, this.data.id);
  };

  keyUp = (e) => {
    const targetId = e.target.id;
    const searchInputId = 'table-search-input-' + this.id + '-input';
    if (targetId === searchInputId && e.key === 'Enter') {
      const inputElem = this.elem.querySelector('#' + searchInputId);
      if (this.previousSearch !== inputElem.value) {
        this.tableParams.page = 1;
        this.tableParams.search = inputElem.value;
        this.previousSearch = this.tableParams.search;
        this.searchOptionsOpen = false;
        this._refreshView();
      }
    } else if (e.key === 'Escape') {
      const inputElem = this.elem.querySelector('#' + searchInputId);
      if (inputElem) {
        inputElem.blur();
        if (this.tableParams.search !== '') {
          this.tableParams.page = 1;
          this.tableParams.search = '';
          this.previousSearch = this.tableParams.search;
          inputElem.value = '';
          this.searchOptionsOpen = false;
          this._refreshView();
        }
      }
    } else if (
      this.data.searchHotKey &&
      e.target.localName.toLowerCase() === 'body' &&
      e.key === this.data.searchHotKey
    ) {
      this.elem.querySelector('#' + searchInputId).focus();
    }
  };

  _drawSearch = () => {
    const searchInputSectionId = 'table-search-input-section-' + this.id;
    const searchInputId = 'table-search-input-' + this.id;
    const searchInputButtonId = 'table-search-button-' + this.id;
    this.addChildDraw({
      id: 'table-search-container-' + this.id,
      template: `<div class="${styles.tableSearchContainer}">
        <div class="${styles.tableSearchInputSection}" id="${searchInputSectionId}"></div>
      </div>`,
    });
    let clearSearchBtn;
    this.addChildDraw(
      new TextInput({
        id: searchInputId,
        attach: searchInputSectionId,
        class: styles.tableSearchInput,
        label: '',
        hideMsg: true,
        placeholder:
          getText('search') +
          (this.data.searchHotKey ? ` [${this.data.searchHotKey.toUpperCase()}]` : ''),
        value: this.tableParams.search,
        changeFn: (e) => {
          const val = e.target.value;
          this.tableParams.search = val;
          if (clearSearchBtn) {
            clearSearchBtn.data.style.display = val.length ? 'block' : 'none';
            clearSearchBtn.draw();
          }
        },
        onFocus: (e) => e.target.setSelectionRange(0, 9999),
      })
    );
    clearSearchBtn = this.addChildDraw(
      new Button({
        id: 'clear-table-search-btn-' + this.id,
        attach: searchInputId,
        class: styles.clearTableSearchButton,
        style: { display: this.tableParams.search.length ? 'block' : 'none' },
        attributes: { title: `${getText('clear_search')} [esc]` },
        click: () => {
          if (this.tableParams.search !== '') {
            this.tableParams.search = '';
            this.previousSearch = '';
            this._refreshView();
          }
        },
      })
    );
    this.addChildDraw(
      new Button({
        id: searchInputButtonId,
        attach: searchInputSectionId,
        class: styles.tableSearchInputButton,
        html: '<div>Go</div>', // TODO: change to an search icon
        click: () => {
          if (this.previousSearch !== this.tableParams.search) {
            this.previousSearch = this.tableParams.search;
            this.tableParams.page = 1;
            this.searchOptionsOpen = false;
            this._refreshView();
          }
        },
      })
    );

    const animateOptionsConfig = {
      from: {
        overflow: 'hidden',
        minHeight: 0,
        height: 0,
        paddingTop: '0',
        paddingBottom: '0',
        duration: 0.2,
      },
      to: {
        overflow: 'hidden',
        minHeight: '24rem',
        paddingTop: '2rem',
        paddingBottom: '2rem',
        duration: 0.4,
        ease: 'back',
      },
      end: {
        overflow: 'visible',
        minHeight: '24rem',
        height: 'auto',
        paddingTop: '2rem',
        paddingBottom: '2rem',
      },
    };
    const searchOptionsComp = this.addChildDraw({
      id: this.searchOptionsId,
      attach: searchInputSectionId,
      class: styles.tableSearchOptions,
      style: animateOptionsConfig.from,
    });
    this.addChildDraw(
      new Button({
        id: 'table-search-toggle-options-' + this.id,
        attach: searchInputSectionId,
        class: [styles.tableSearchToggleOptions, 'link'],
        text: getText('search_settings'),
        click: () => {
          const outsideClickId = 'outside-options-click-listener-' + this.id;
          if (this.searchOptionsOpen) {
            this._closeSearchOptions(searchOptionsComp.elem, animateOptionsConfig, outsideClickId);
          } else {
            this._openSearchOptions(searchOptionsComp.elem, animateOptionsConfig, outsideClickId);
          }
        },
      })
    );
    this.addChildDraw({
      id: 'table-search-change-case-' + this.id,
      attach: this.searchOptionsId,
    });
    this.addChildDraw(
      new Checkbox({
        id: 'table-search-change-case-' + this.id,
        attach: this.searchOptionsId,
        label: getText('match_case'),
        name: 'match-case',
        value: this.tableParams.caseSensitive,
        changeFn: (e) => {
          const checked = e.target.checked;
          this.tableParams.caseSensitive = checked;
          this.previousSearch = '';
        },
      })
    );
    const selectedFields = this.tableParams.searchFields.split(',');
    this.addChildDraw(
      new CheckboxList({
        id: 'table-search-change-fields-' + this.id,
        attach: this.searchOptionsId,
        label: getText('columns_to_search'),
        minSelections: 1,
        selectors: [
          { key: 'formId', label: getText('form_id'), selected: selectedFields.includes('formId') },
          { key: 'path', label: getText('path'), selected: selectedFields.includes('path') },
          { key: 'method', label: getText('method'), selected: selectedFields.includes('method') },
          { key: 'type', label: getText('type'), selected: selectedFields.includes('type') },
        ],
        changeFn: (e, selectors) => {
          this.previousSearch = '';
          this.tableParams.searchFields = selectors
            .filter((s) => s.selected)
            .map((s) => s.key)
            .join(',');
        },
      })
    );
    this.addListenerAfterDraw({
      id: 'table-search-keyup-listener-' + this.id,
      target: window,
      type: 'keyup',
      fn: this.keyUp,
    });
  };

  _closeSearchOptions = (elem, animateOptionsConfig, outsideClickId) => {
    gsap.to(elem, animateOptionsConfig.from);
    this.removeListener(outsideClickId);
    this.searchOptionsOpen = false;
  };

  _openSearchOptions = (elem, animateOptionsConfig, outsideClickId) => {
    gsap.to(elem, {
      ...animateOptionsConfig.to,
      onComplete: () => gsap.set(elem, animateOptionsConfig.end),
    });
    this.addListener({
      id: outsideClickId,
      target: window,
      type: 'click',
      fn: (e) => {
        let node = e.target,
          counter = 0,
          whileSwitch = true;
        while (whileSwitch) {
          if (!node) node = document.getElementById(this.searchOptionsId);
          if (!node) return;
          const id = node.id;
          if (id === this.searchOptionsId || id === 'table-search-toggle-options-' + this.id) {
            return;
          }
          if (node.localName.toLowerCase() === 'html') {
            this.searchOptionsOpen = true;
            this._closeSearchOptions(elem, animateOptionsConfig, outsideClickId);
            return;
          }
          node = node.parentElement;
          counter++;
          if (counter > 100) {
            return;
          }
        }
      },
    });
    this.searchOptionsOpen = true;
  };
}

export default TableWithSearch;
