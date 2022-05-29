import { getText } from '../../../helpers/lang';
import { Component } from '../../../LIGHTER';

// Attributes:
// - options = array of objects with value, label, disabled [Array[Object]] [required]
// - label = field label [String]
// - name = input name property [String]
// - hideMsg = if field's error message should not be shown [Booolean]
// - changeFn = function that is ran after each change [Function]
// - value or selected = tells which value is selected (value is primary) [String]
// - emptyIsAnOption = [Boolean]
// - disabled = whether the field is disabled or not [Boolean]
// - error = an error boolean or object to tell if the field has errors {hasError:Boolean, errorMsg:String} [Boolean/Object]
class Dropdown extends Component {
  constructor(data) {
    super(data);
    if (!data.options || !data.options.length) {
      this.logger.error(
        `Dropdown Component (${data.id}) could not find options array or the array was empty.`
      );
      throw new Error('Call stack');
    }
    if (!data.name) data.name = data.id;
    if (!data.label) data.label = data.id;
    this.selectId = this.id + '-select';
    this.options = [];
    if (data.value === undefined) {
      this.value = data.selected !== undefined ? data.selected : '';
    } else {
      this.value = data.value;
    }
    this.template = `
            <div class="form-elem form-elem--dropdown">
                <label for="${this.selectId}">
                    <span class="form-elem__label">${data.label}</span>
                    <select
                        id="${this.selectId}"
                        class="form-elem__select"
                        type="checkbox"
                        name="${data.name}"
                        ${data.disabled ? 'disabled' : ''}
                    >${this._createOptionsTemplate(
                      data.options,
                      this.value,
                      data.emptyIsAnOption
                    )}</select>
                </label>
            </div>
        `;
    this.errorComp = this.addChild({
      id: this.id + '-error-msg',
      class: 'form-elem__error-msg',
    });
    if (data.error) data.class = 'form-elem--error';
  }

  addListeners(data) {
    this.addListener({
      id: this.selectId + '-click',
      target: document.getElementById(this.selectId),
      type: 'click',
      fn: (e) => {
        const newVal = e.target.value;
        if (newVal === this.value) return;
        this.value = e.target.value;
        this.data.value = this.data.selected = this.value;
        if (data.changeFn) data.changeFn(e);
      },
    });
  }

  paint(data) {
    const selectElem = document.getElementById(this.selectId);
    selectElem.checked = data.checked;
    if (data.value || data.selected) {
      this.value = data.value || data.selected;
      this.data.value = this.data.selected = this.value;
    }
    if (data.error) {
      this.elem.classList.add('form-elem--error');
      if (data.error.errorMsg) {
        this.elem.classList.add('form-elem--error-msg');
        this.errorComp.draw({ text: data.error.errorMsg });
      }
    }
    if (data.disabled) selectElem.setAttribute('disabled', '');
  }

  error(err) {
    if (err) {
      this.errorComp.discard();
      this.elem.classList.add('form-elem--error');
      if (err.errorMsg && !this.data.hideMsg) {
        this.elem.classList.add('form-elem--error-msg');
        this.errorComp.draw({ text: err.errorMsg });
      }
    } else {
      this.errorComp.discard();
      this.elem.classList.remove('form-elem--error');
      this.elem.classList.remove('form-elem--error-msg');
    }
  }

  _createOptionsTemplate(options, selected, emptyIsAnOption) {
    let template = '';
    const selectedIsNotAValue = selected === undefined || selected === null;
    if (selectedIsNotAValue || emptyIsAnOption) {
      const selectedAttr =
        (emptyIsAnOption && selectedIsNotAValue) || selectedIsNotAValue ? ' selected' : '';
      template += `<option value=""${selectedAttr}>[${getText('select')}]</option>`;
    }
    for (let i = 0; i < options.length; i++) {
      template += '<option value="' + options[i].value + '"';
      if (options[i].disabled) template += ' disabled';
      if (selected && String(options[i].value) === String(selected)) template += ' selected';
      template += '>' + options[i].label + '</option>';
    }
    return template;
  }

  setValue(newValue, noChangeFn) {
    const selectElem = document.getElementById(this.selectId);
    const opts = selectElem.children;
    const newVal = String(newValue);
    let valueFound = false;
    for (let i = 0; i < opts.length; i++) {
      if (opts[i].value === newVal) {
        valueFound = true;
        this.value = newVal;
        this.data.value = this.data.selected = this.value;
        break;
      }
    }
    if (valueFound) {
      for (let i = 0; i < opts.length; i++) {
        if (opts[i].value === newVal) {
          opts[i].selected = true;
        } else {
          opts[i].selected = false;
        }
      }
      if (noChangeFn) return;
      if (this.data.changeFn) this.data.changeFn({ target: selectElem });
    } else {
      this.logger.warn('Could not locate dropdown value in Dropdown -> setValue', newValue);
    }
  }
}

export default Dropdown;
