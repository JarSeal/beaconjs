import { Component } from '../../../LIGHTER';

// Attributes:
// - label = field label [String]
// - name = input name property [String]
// - hideMsg = if field's error message should not be shown [Booolean]
// - changeFn = function that is ran after each change [Function]
// - value or checked = whether the box is checked or not [Boolean]
// - disabled = whether the field is disabled or not [Boolean]
// - error = an error boolean or object to tell if the field has errors {hasError:Boolean, errorMsg:String} [Boolean/Object]
class Checkbox extends Component {
  constructor(data) {
    super(data);
    if (!data.name) data.name = data.id;
    if (!data.label) data.label = data.id;
    this.inputId = this.id + '-input';
    this.template = `
            <div class="form-elem form-elem--checkbox">
                <label for="${this.inputId}">
                    <span class="form-elem__label">${data.label}</span>
                    <input
                        id="${this.inputId}"
                        class="form-elem__checkbox"
                        type="checkbox"
                        name="${data.name}"
                        ${
                          data.value === true ||
                          data.value === 'true' ||
                          data.checked === true ||
                          data.checked === 'true'
                            ? 'checked'
                            : ''
                        }
                        ${data.disabled ? 'disabled' : ''}
                    />
                </label>
            </div>
        `;
    this.value =
      data.value === true ||
      data.value === 'true' ||
      data.checked === true ||
      data.checked === 'true' ||
      false;
    this.errorComp = this.addChild({
      id: this.id + '-error-msg',
      class: 'form-elem__error-msg',
    });
    if (data.error) data.class = 'form-elem--error';
  }

  addListeners(data) {
    this.addListener({
      id: this.inputId + '-click',
      target: document.getElementById(this.inputId),
      type: 'click',
      fn: (e) => {
        this.value = e.target.checked;
        this.data.value = this.data.checked = this.value;
        if (this.value === false || this.value === 'false') {
          this.elem.classList.remove('form-elem--checked');
        } else {
          this.elem.classList.add('form-elem--checked');
        }
        if (data.changeFn) data.changeFn(e);
      },
    });
  }

  paint(data) {
    const inputElem = document.getElementById(this.inputId);
    if (
      data.checked === true ||
      data.checked === false ||
      data.value === true ||
      data.value === false ||
      data.checked === 'true' ||
      data.checked === 'false' ||
      data.value === 'true' ||
      data.value === 'false'
    ) {
      this.value =
        data.value === true ||
        data.value === 'true' ||
        data.checked === true ||
        data.checked === 'true' ||
        false;
      this.data.value = this.data.checked = this.value;
    }
    inputElem.checked = this.value;
    if (this.value === false || this.value === 'false') {
      this.elem.classList.remove('form-elem--checked');
    } else {
      this.elem.classList.add('form-elem--checked');
    }
    if (data.error) {
      this.elem.classList.add('form-elem--error');
      if (data.error.errorMsg) {
        this.elem.classList.add('form-elem--error-msg');
        this.errorComp.draw({ text: data.error.errorMsg });
      }
    }
    if (data.disabled) inputElem.setAttribute('disabled', '');
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

  setValue = (newValue, noChangeFn) => {
    const inputElem = document.getElementById(this.inputId);
    if (newValue === false || newValue === 'false') {
      this.value = false;
      inputElem.checked = false;
      this.elem.classList.remove('form-elem--checked');
    } else {
      this.value = true;
      inputElem.checked = true;
      this.elem.classList.add('form-elem--checked');
    }
    this.data.value = this.data.checked = this.value;
    if (noChangeFn) return;
    if (this.data.changeFn) this.data.changeFn({ target: inputElem });
  };
}

export default Checkbox;
