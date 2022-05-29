import Component from '../../../LIGHTER/Component';

// Attributes:
// - value = value to display on the field [String]
// - label = field label [String]
// - placeholder = field placeholder [String]
// - name = textarea name property [String]
// - hideMsg = if field's error message should not be shown [Booolean]
// - changeFn = function that is ran after each change [Function]
// - disabled = whether the field is disabled or not [Boolean]
// - error = an error boolean or object to tell if the field has errors {hasError:Boolean, errorMsg:String} [Boolean/Object]
// - maxlength = html max length attribute value for textarea elem [Number/String]
class TextArea extends Component {
  constructor(data) {
    super(data);
    if (!data.name) data.name = data.id;
    if (!data.label) data.label = data.id;
    this.textareaId = this.id + '-textarea';
    this.template = `
            <div class="form-elem form-elem--text-textarea">
                <label for="${this.textareaId}">
                    <span class="form-elem__label">${data.label}</span>
                    <textarea
                        id="${this.textareaId}"
                        class="form-elem__textarea"
                        name="${data.name}"
                        placeholder="${data.placeholder || ''}"
                        ${data.maxlength ? 'maxlength="' + data.maxlength + '"' : ''}
                        ${data.disabled ? 'disabled' : ''}
                    >${data.value || ''}</textarea>
                </label>
            </div>
        `;
    this.value = data.value || '';
    this.errorComp = this.addChild({
      id: this.id + '-error-msg',
      class: 'form-elem__error-msg',
    });
    if (data.error) data.class = 'form-elem--error';
  }

  addListeners(data) {
    this.addListener({
      id: this.textareaId + '-keyup',
      target: document.getElementById(this.textareaId),
      type: 'keyup',
      fn: (e) => {
        this.value = e.target.value;
        this.data.value = this.value;
        if (data.changeFn) data.changeFn(e);
      },
    });
  }

  paint(data) {
    const textareaElem = document.getElementById(this.textareaId);
    if (data.value !== undefined) {
      this.value = data.value;
      this.data.value = data.value;
    }
    textareaElem.value = this.value;
    if (data.error) {
      this.elem.classList.add('form-elem--error');
      if (data.error.errorMsg) {
        this.elem.classList.add('form-elem--error-msg');
        this.errorComp.draw({ text: data.error.errorMsg });
      }
    }
    if (data.disabled) textareaElem.setAttribute('disabled', '');
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

  setValue(newValue, noChangeFn) {
    this.value = String(newValue);
    const textareaElem = document.getElementById(this.textareaId);
    textareaElem.value = this.value;
    this.data.value = this.value;
    if (noChangeFn) return;
    if (this.data.changeFn) this.data.changeFn({ target: textareaElem });
  }
}

export default TextArea;
