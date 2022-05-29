import { getText } from '../../../helpers/lang';
import { Component } from '../../../LIGHTER';

// Attributes for data:
// - label: String, (the main label for the checkboxlist)
// - changeFn: Function(event, selectors)
// - minSelections: Number,
// - maxSelections: Number,
// - selectors: Array[Object],
//     - key: String,
//     - label: String,
//     - selected: Boolean,
class CheckboxList extends Component {
  constructor(data) {
    super(data);
    this.label = data.label;
    this.selectors = data.selectors;
    this.minSelections = data.minSelections;
    this.maxSelections = data.maxSelections;
    this.selectedCount = 0;
    this.template = `
            <div class="form-elem form-elem--checkboxlist">
                <label class="form-elem__label">${this.label}</label>
                <div class="form-elem__error-msg" id="${this.id}-error-msg"></div>
            </div>`;
  }

  _addClickListeners(data) {
    for (let i = 0; i < this.selectors.length; i++) {
      const itemElem = document.getElementById(
        this.selectors[i].key + '-_-' + this.id + '-checkboxlist-item'
      );
      this.addListener({
        id: `${this.selectors[i].key}-click`,
        target: itemElem,
        type: 'click',
        fn: (e) => {
          if (e.target.checked === false) {
            if (this.minSelections && this.minSelections >= this.selectedCount) {
              e.target.checked = true;
              this.elem.querySelector('#' + this.id + '-error-msg').innerText = getText(
                'minimum_x',
                [this.minSelections]
              );
              return;
            }
            e.target.parentElement.classList.remove('checkboxlist-item--selected');
            this.selectedCount--;
          } else {
            if (this.maxSelections && this.maxSelections <= this.selectedCount) {
              e.target.checked = false;
              this.elem.querySelector('#' + this.id + '-error-msg').innerText = getText(
                'maximum_x',
                [this.maxSelections]
              );
              return;
            }
            e.target.parentElement.classList.add('checkboxlist-item--selected');
            this.selectedCount++;
          }
          this.selectors[i].selected = e.target.checked;
          this.elem.querySelector('#' + this.id + '-error-msg').innerText = '';
          if (data.changeFn) data.changeFn(e, this.selectors);
        },
      });
    }
  }

  paint = (data) => {
    this._createList();
    this._addClickListeners(data);
  };

  _createList = () => {
    let listHTML = `<div class="form-elem__list-wrapper" id="${this.id}-list-wrapper">`;
    for (let i = 0; i < this.selectors.length; i++) {
      this.selectors[i].index = i;
      if (this.selectors[i].selected) {
        if (this.maxSelections) {
          if (this.selectedCount < this.maxSelections) {
            this.selectedCount++;
          } else {
            this.selectors[i].selected = false;
          }
        } else {
          this.selectedCount++;
        }
      }

      listHTML += `<label
            class="checkboxlist-item${
              this.selectors[i].selected ? ' checkboxlist-item--selected' : ''
            }"
            for="${this.selectors[i].key}-_-${this.id}-checkboxlist-item">
                <span class="checkboxlist-item__label">${this.selectors[i].label}</span>
                <input
                    type="checkbox"
                    id="${this.selectors[i].key}-_-${this.id}-checkboxlist-item"
                    name="${this.selectors[i].key}-_-${this.id}-checkboxlist-item"
                    class="checkboxlist-item__input"
                    ${this.selectors[i].selected ? 'checked' : ''}
                />
            </label>`;
    }
    listHTML += '</div>';
    this.addChild(
      new Component({
        id: this.id + '-checkboxes-list',
        template: listHTML,
      })
    ).draw();
  };
}

export default CheckboxList;
