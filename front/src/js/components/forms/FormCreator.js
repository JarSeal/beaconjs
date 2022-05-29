import axios from 'axios';
import { getLang, getText } from '../../helpers/lang';
import shared from '../../shared/index.js';
import { Component, Logger, State } from '../../LIGHTER';
import { _CONFIG } from '../../_CONFIG';
import validationFns from './formData/validationFns';
import optionsFns from './formData/optionsFns';
import Spinner from '../widgets/Spinner';
import Checkbox from './formComponents/Checkbox';
import Dropdown from './formComponents/Dropdown';
import SubmitButton from './formComponents/SubmitButton';
import TextInput from './formComponents/TextInput';
import TextArea from './formComponents/TextArea';
import Button from '../buttons/Button';

// Attributes for data:
// - local = must be set to true if local forms are used (all the form data must then be in in the data) [Boolean]
// - beforeFormSendingFn = function to call before actual form submission [Function]
// - afterFormSentFn = function to call after succesfull form submission [Function]
// - addToMessage = Object to add to the post or put body [Object]
// - editDataId = Data id to be retrieved with the form data to populate the form [String] (for edit forms)
// - onErrorsFn = Function to callback after form sending errors [Function] (properties: exception, exception.response)
// - formLoadedFn = Function to callback after the form has finished loading [Function]
// - extraButton = Object with 'label' or 'labelId' (String) and 'clickFn' (Function) properties (adds an extra button next to the submit button)
// - onFormChanges = Function to callback when a change to the form is made [Function]
// - fieldInitValues = Object with field id as key and value as field value
class FormCreator extends Component {
  constructor(data) {
    super(data);
    this.appState = data.appState;
    this.logger = new Logger('Form Creator *****');
    this.afterFormSentFn = data.afterFormSentFn;
    this.template = '<form class="form-creator"></form>';
    this.Dialog = data.dialog;
    this.components = {};
    this.componentsOrder = [];
    this.curLang = getLang();
    this.formHasChanges = false;
    this.formSentOnce = false;
    this.formSubmitted = false;
    this.fieldErrors = new State();
    this.formState = new State({
      getting: false,
      sending: false,
    });
    this.formErrorClassSetterTimer;
    this.submitButtonId;
    this.fieldsetIds = [];
    this.exceptionError = false;
    this.cssClasses = {
      formSent: 'form--sent',
      formError: 'form--errors',
      fieldsetError: 'fieldset--errors',
      formSuccess: 'form--success',
    };

    if (data.local) {
      this._createFormComponents(data);
    } else {
      const spinnerFadeTime = 400;
      this.mainSpinner = this.addChild(
        new Spinner({
          id: this.id + '-main-spinner',
          fadeTime: spinnerFadeTime,
          class: 'form-loader-spinner',
        })
      );
      this.formState.addListener('getting', (newValue) => {
        if (newValue === false) {
          this._createFormComponents(this.data);
          this.rePaint();
          this.mainSpinner.showSpinner(false);
          if (this.data.formLoadedFn) this.data.formLoadedFn();
          setTimeout(() => {
            this.mainSpinner.discard(true);
            this.mainSpinner = null;
          }, spinnerFadeTime + 200);
        }
      });
    }
  }

  addListeners = () => {
    this.addListener({
      type: 'submit',
      fn: this.handleSubmit,
    });
  };

  init = (data) => {
    if (!data.local) {
      this._loadFormData(data.id);
    }
  };

  paint = (data) => {
    if (this.formSubmitted) {
      if (this.components[this.id + '-title']) this.components[this.id + '-title'].draw();
      const msgTopComp = this.components[this.id + '-msg-top'];
      if (msgTopComp) {
        msgTopComp.draw({
          text: this._getTextData(data.afterSubmitMsg, data.afterSubmitMsgId),
        });
      }
    } else {
      if (this.mainSpinner) {
        this.mainSpinner.draw();
        this.mainSpinner.showSpinner(true);
      }
      for (let i = 0; i < this.componentsOrder.length; i++) {
        const key = this.componentsOrder[i];
        this.components[key].draw();
      }
    }
  };

  _createFormComponents(data) {
    let id, text;

    // Form class
    if (data.class) {
      if (typeof data.class === 'string' || data.class instanceof String) {
        this.elem.classList.add(data.class);
      } else {
        this.elem.classList.add(...data.class);
      }
    }

    // Form message top
    id = this.id + '-msg-top';
    this.componentsOrder.push(id);
    this.components[id] = this.addChild({
      id,
      class: ['form-msg', 'form-msg-top'],
    });

    // Form title and description
    text = this._getTextData(data.formTitle, data.formTitleId);
    if (text) {
      id = this.id + '-title';
      this.componentsOrder.push(id);
      this.components[id] = this.addChild({
        id,
        tag: 'h3',
        text,
        class: 'form-main-title',
      });
    }
    text = this._getTextData(data.formDesc, data.formDescId);
    if (text) {
      id = this.id + '-description';
      this.componentsOrder.push(id);
      this.components[id] = this.addChild({
        id,
        tag: 'p',
        text,
        class: 'form-main-description',
      });
    }

    // Fieldsets
    let fieldsets = data.fieldsets;
    if (!fieldsets) fieldsets = [];
    for (let i = 0; i < fieldsets.length; i++) {
      const fieldset = data.fieldsets[i];
      const fieldsetId = fieldset.id;
      this.fieldsetIds.push(fieldsetId);

      fieldset.tag = 'fieldset';
      if (fieldset.disabled) fieldset.attributes = { disabled: '' };
      this.componentsOrder.push(fieldsetId);
      this.components[fieldsetId] = this.addChild(fieldset);

      // Fieldset title and description
      text = this._getTextData(fieldset.fieldsetTitle, fieldset.fieldsetTitleId);
      if (text) {
        id = this.id + '-fieldset-' + i + '-title';
        this.componentsOrder.push(id);
        this.components[id] = this.addChild({
          id,
          tag: 'h3',
          text,
          class: 'fieldset-title',
          attach: fieldsetId,
        });
      }
      text = this._getTextData(fieldset.fieldsetDesc, fieldset.fieldsetDescId);
      if (text) {
        id = this.id + '-fieldset-' + i + '-description';
        this.componentsOrder.push(id);
        this.components[id] = this.addChild({
          id,
          tag: 'p',
          text,
          class: 'fieldset-description',
          attach: fieldsetId,
        });
      }

      // Fields
      for (let j = 0; j < fieldset.fields.length; j++) {
        const field = fieldset.fields[j];
        const fieldIdPrefix = this.id + '-' + i + '-' + j;

        // Divider
        if (field.type === 'divider') {
          id = fieldIdPrefix + '-divider';
          this.componentsOrder.push(id);
          this.components[id] = this.addChild({
            id,
            class: 'form-divider',
            attach: fieldsetId,
          });
        }

        // Subheading
        else if (field.type === 'subheading') {
          id = fieldIdPrefix + '-subheading';
          text = this._getTextData(field.content, field.contentId);
          this.componentsOrder.push(id);
          this.components[id] = this.addChild({
            id,
            tag: 'h4',
            class: 'form-subheading',
            attach: fieldsetId,
            text,
          });
        }

        // Text input
        else if (field.type === 'textinput') {
          this._fieldTextInput(field, fieldsetId, fieldIdPrefix);
        }

        // Checkbox
        else if (field.type === 'checkbox') {
          this._fieldCheckbox(field, fieldsetId, fieldIdPrefix);
        }

        // Dropdown
        else if (field.type === 'dropdown') {
          this._fieldDropdown(field, fieldsetId, fieldIdPrefix);
        }

        // Textarea
        else if (field.type === 'textarea') {
          this._fieldTextArea(field, fieldsetId, fieldIdPrefix);
        }
      }
    }

    // Spinner
    id = this.id + '-spinner-icon';
    this.componentsOrder.push(id);
    this.components[id] = this.addChild(
      new Spinner({
        id,
      })
    );

    // Extra button
    if (data.extraButton) {
      const extraButton = data.extraButton;
      id = this.id + '-extra-button';
      text = this._getTextData(extraButton.label, extraButton.labelId);
      let classes = ['form-elem', 'form-elem--button', 'extra-button'];
      if (extraButton.class) {
        if (typeof extraButton.class === 'string' || extraButton.class instanceof String) {
          classes.push(extraButton.class);
        } else {
          classes = [...extraButton.class, ...classes];
        }
      }
      this.componentsOrder.push(id);
      const extraButtonProps = {
        id,
        text,
        class: classes,
        click: (e) => {
          extraButton.clickFn(e);
        },
      };
      this.components[id] = this.addChild(new Button(extraButtonProps));
    }

    // Submit button
    const button = data.submitButton;
    id = button.id || this.id + '-submit-button';
    this.submitButtonId = id;
    text = this._getTextData(button.label, button.labelId);
    this.componentsOrder.push(id);
    this.components[id] = this.addChild(
      new SubmitButton({
        id,
        text,
        class: button.class,
      })
    );

    // Form message bottom
    id = this.id + '-msg-bottom';
    this.componentsOrder.push(id);
    this.components[id] = this.addChild({
      id,
      class: ['form-msg', 'form-msg-bottom'],
    });

    // Sending form State listener
    this.formState.addListener('sending', (newValue) => {
      this.components[this.id + '-spinner-icon'].showSpinner(newValue);
      if (newValue) {
        // Disable submit button and fields
        document.getElementById(this.submitButtonId).setAttribute('disabled', '');
        for (let i = 0; i < this.fieldsetIds.length; i++) {
          const elem = document.getElementById(this.fieldsetIds[i]);
          elem.setAttribute('disabled', '');
        }
      } else {
        // Enable submit button and fields
        document.getElementById(this.submitButtonId).removeAttribute('disabled');
        for (let i = 0; i < this.fieldsetIds.length; i++) {
          for (let j = 0; j < fieldsets.length; j++) {
            if (fieldsets[j].id === this.fieldsetIds[i] && !fieldsets[j].disabled) {
              const elem = document.getElementById(this.fieldsetIds[i]);
              elem.removeAttribute('disabled');
              break;
            }
          }
        }
      }
    });
  }

  _fieldTextArea(field, fieldsetId, fieldIdPrefix) {
    let id = field.id;
    if (!id) id = fieldIdPrefix + '-textarea';
    const label = (field.required ? '* ' : '') + this._getTextData(field.label, field.labelId);
    const placeholder = this._getTextData(field.placeholder, field.placeholderId);
    this.fieldErrors.set(id, false);
    if (this.data.data !== undefined && this.data.data[id] !== undefined)
      field.initValue = this.data.data[id];
    if (this.data.fieldInitValues !== undefined && this.data.fieldInitValues[id] !== undefined)
      field.initValue = this.data.fieldInitValues[id];
    this.componentsOrder.push(id);
    this.components[id] = this.addChild(
      new TextArea({
        id,
        name: field.name,
        class: field.class,
        label,
        placeholder,
        attach: fieldsetId,
        hideMsg: field.hideMsg,
        disabled: field.disabled,
        maxlength: field.maxLength,
        value:
          field.maxLength && field.initValue
            ? field.initValue.substring(0, parseInt(field.maxLength)) || ''
            : field.initValue || '',
        field,
        changeFn: (e) => {
          const val = e.target.value;
          this._fieldTextAreaErrorCheck({ val, id, field, fieldsetId });
          if (field.onChangeFn) {
            field.onChangeFn({
              val,
              id,
              fieldsetId,
              fieldErrors: this.fieldErrors,
              field: this.components[id],
              components: this.components,
            });
          }
          this._displayFieldError(id);
          this.formHasChanges = true;
          if (this.data.onFormChanges) this.data.onFormChanges();
        },
      })
    );
    this.components[id]['fieldsetId'] = fieldsetId;
    this.components[id]['errorChecker'] = this._fieldTextAreaErrorCheck;
    this.components[id]['displayFieldError'] = () => {
      this._displayFieldError(id);
    };
  }

  _fieldDropdown(field, fieldsetId, fieldIdPrefix) {
    let id = field.id;
    if (!id) id = fieldIdPrefix + '-dropdown';
    const label = (field.required ? '* ' : '') + this._getTextData(field.label, field.labelId);
    this.fieldErrors.set(id, false);
    if (this.data.data !== undefined && this.data.data[id] !== undefined)
      field.initValue = this.data.data[id];
    if (this.data.fieldInitValues !== undefined && this.data.fieldInitValues[id] !== undefined)
      field.initValue = this.data.fieldInitValues[id];
    let options = [];
    if (field.options) {
      for (let i = 0; i < field.options.length; i++) {
        options.push(field.options[i]);
        options[i].label = this._getTextData(field.options[i].label, field.options[i].labelId);
      }
    } else {
      if (!field.getOptionsFn) {
        this.logger.error(
          'The drop down field has to have either the options or the getOptionsFn property.'
        );
        throw new Error('Call stack');
      }
      options = optionsFns[field.getOptionsFn]({
        readerLevel: this.appState.get('user.userLevel'),
      });
      for (let i = 0; i < options.length; i++) {
        options[i].label = this._getTextData(options[i].label, options[i].labelId);
      }
    }
    this.componentsOrder.push(id);
    this.components[id] = this.addChild(
      new Dropdown({
        id,
        name: field.name,
        class: field.class,
        label,
        attach: fieldsetId,
        hideMsg: field.hideMsg,
        disabled: field.disabled,
        value: field.initValue,
        options,
        emptyIsAnOption: field.emptyIsAnOption,
        field,
        changeFn: (e) => {
          const val = e.target.value;
          this._fieldDropdownErrorCheck({ val, id, field, fieldsetId });
          if (field.onChangeFn) {
            field.onChangeFn({
              val,
              id,
              fieldsetId,
              fieldErrors: this.fieldErrors,
              field: this.components[id],
              components: this.components,
            });
          }
          this._displayFieldError(id);
          this.formHasChanges = true;
          if (this.data.onFormChanges) this.data.onFormChanges();
        },
      })
    );
    this.components[id]['fieldsetId'] = fieldsetId;
    this.components[id]['errorChecker'] = this._fieldDropdownErrorCheck;
    this.components[id]['displayFieldError'] = () => {
      this._displayFieldError(id);
    };
  }

  _fieldCheckbox(field, fieldsetId, fieldIdPrefix) {
    let id = field.id;
    if (!id) id = fieldIdPrefix + '-checkbox';
    const label = (field.required ? '* ' : '') + this._getTextData(field.label, field.labelId);
    this.fieldErrors.set(id, false);
    if (this.data.data !== undefined && this.data.data[id] !== undefined)
      field.initValue = this.data.data[id] === true || this.data.data[id] === 'true' ? true : false;
    if (this.data.fieldInitValues !== undefined && this.data.fieldInitValues[id] !== undefined)
      field.initValue = this.data.fieldInitValues[id];
    this.componentsOrder.push(id);
    this.components[id] = this.addChild(
      new Checkbox({
        id,
        name: field.name,
        class: field.class,
        label,
        attach: fieldsetId,
        hideMsg: field.hideMsg,
        disabled: field.disabled,
        checked: field.initValue ? true : false,
        field,
        changeFn: (e) => {
          const val = e.target.checked;
          this._fieldCheckboxErrorCheck({ val, id, field, fieldsetId });
          if (field.onChangeFn) {
            field.onChangeFn({
              val,
              id,
              fieldsetId,
              fieldErrors: this.fieldErrors,
              field: this.components[id],
              components: this.components,
            });
          }
          this._displayFieldError(id);
          this.formHasChanges = true;
          if (this.data.onFormChanges) this.data.onFormChanges();
        },
      })
    );
    this.components[id]['fieldsetId'] = fieldsetId;
    this.components[id]['errorChecker'] = this._fieldCheckboxErrorCheck;
    this.components[id]['displayFieldError'] = () => {
      this._displayFieldError(id);
    };
  }

  _fieldTextInput(field, fieldsetId, fieldIdPrefix) {
    let id = field.id;
    if (!id) id = fieldIdPrefix + '-textinput';
    const label = (field.required ? '* ' : '') + this._getTextData(field.label, field.labelId);
    const placeholder = this._getTextData(field.placeholder, field.placeholderId);
    if (this.data.data !== undefined && this.data.data[id] !== undefined)
      field.initValue = this.data.data[id];
    if (this.data.fieldInitValues !== undefined && this.data.fieldInitValues[id] !== undefined)
      field.initValue = this.data.fieldInitValues[id];
    this.fieldErrors.set(id, false);
    this.componentsOrder.push(id);
    this.components[id] = this.addChild(
      new TextInput({
        id,
        name: field.name,
        class: field.class,
        label,
        placeholder,
        attach: fieldsetId,
        hideMsg: field.hideMsg,
        disabled: field.disabled,
        maxlength: field.maxLength,
        value:
          field.maxLength && field.initValue
            ? field.initValue.substring(0, parseInt(field.maxLength)) || ''
            : field.initValue || '',
        password: field.password,
        field,
        changeFn: (e) => {
          const val = e.target.value;
          this._fieldTextInputErrorCheck({ val, id, field, fieldsetId });
          if (field.onChangeFn) {
            field.onChangeFn({
              val,
              id,
              fieldsetId,
              fieldErrors: this.fieldErrors,
              field: this.components[id],
              components: this.components,
            });
          }
          this._displayFieldError(id);
          this.formHasChanges = true;
          if (this.data.onFormChanges) this.data.onFormChanges();
        },
      })
    );
    this.components[id]['fieldsetId'] = fieldsetId;
    this.components[id]['errorChecker'] = this._fieldTextInputErrorCheck;
    this.components[id]['displayFieldError'] = () => {
      this._displayFieldError(id);
    };
  }

  _fieldTextAreaErrorCheck = (args) => {
    let { val, id, field, fieldsetId } = args;
    val = val.trim();
    if (field.required && !val.length) {
      this.fieldErrors.set(id, {
        errorMsg: getText('required'),
        fieldsetId,
        id,
      });
    } else if (val.length && val.length < field.minLength) {
      this.fieldErrors.set(id, {
        errorMsg: getText('minimum_x_characters', [field.minLength]),
        fieldsetId,
        id,
      });
    } else if (val.length && field.regex) {
      const regex = new RegExp(field.regex);
      if (!regex.test(val.trim())) {
        const text = this._getTextData(field.regexErrorMsg, field.regexErrorMsgId) || '';
        this.fieldErrors.set(id, {
          errorMsg: text,
          fieldsetId,
          id,
        });
      } else {
        this.fieldErrors.set(id, false);
      }
    } else {
      this.fieldErrors.set(id, false);
    }
    if (field.validationFn) {
      if (!validationFns[field.validationFn]) {
        this.logger.error(`Could not find validationFn (id: ${field.validationFn}).`);
        throw new Error('Call stack');
      }
      validationFns[field.validationFn]({
        val,
        id,
        fieldsetId,
        fieldErrors: this.fieldErrors,
        field,
        components: this.components,
      });
    }
    this.fieldsetErrorCheck(fieldsetId);
  };

  _fieldDropdownErrorCheck = (args) => {
    let { val, id, field, fieldsetId } = args;
    if (field.required && val === '') {
      this.fieldErrors.set(id, {
        errorMsg: getText('required'),
        fieldsetId,
        id,
      });
    } else {
      this.fieldErrors.set(id, false);
    }
    if (field.validationFn) {
      validationFns[field.validationFn]({
        val,
        id,
        fieldsetId,
        fieldErrors: this.fieldErrors,
        field,
        components: this.components,
      });
    }
    this.fieldsetErrorCheck(fieldsetId);
  };

  _fieldCheckboxErrorCheck = (args) => {
    let { val, id, field, fieldsetId } = args;
    if (field.required && val === false) {
      this.fieldErrors.set(id, {
        errorMsg: getText('required'),
        fieldsetId,
        id,
      });
    } else {
      this.fieldErrors.set(id, false);
    }
    if (field.validationFn) {
      validationFns[field.validationFn]({
        val,
        id,
        fieldsetId,
        fieldErrors: this.fieldErrors,
        field,
        components: this.components,
      });
    }
    this.fieldsetErrorCheck(fieldsetId);
  };

  _fieldTextInputErrorCheck = (args) => {
    let { val, id, field, fieldsetId } = args;
    val = val.trim();
    if (field.required && !val.length) {
      this.fieldErrors.set(id, {
        errorMsg: getText('required'),
        fieldsetId,
        id,
      });
    } else if (val.length && val.length < field.minLength) {
      this.fieldErrors.set(id, {
        errorMsg: getText('minimum_x_characters', [field.minLength]),
        fieldsetId,
        id,
      });
    } else if (field.email && val.length && !shared.parsers.validateEmail(val)) {
      this.fieldErrors.set(id, {
        errorMsg: getText('email_not_valid'),
        fieldsetId,
        id,
      });
    } else if (val.length && field.regex) {
      const regex = new RegExp(field.regex);
      if (!regex.test(val.trim())) {
        const text = this._getTextData(field.regexErrorMsg, field.regexErrorMsgId) || '';
        this.fieldErrors.set(id, {
          errorMsg: text,
          fieldsetId,
          id,
        });
      } else {
        this.fieldErrors.set(id, false);
      }
    } else {
      this.fieldErrors.set(id, false);
    }
    if (field.validationFn) {
      if (!validationFns[field.validationFn]) {
        this.logger.error(`Could not find validationFn (id: ${field.validationFn}).`);
        throw new Error('Call stack');
      }
      validationFns[field.validationFn]({
        val,
        id,
        fieldsetId,
        fieldErrors: this.fieldErrors,
        field,
        components: this.components,
      });
    }
    this.fieldsetErrorCheck(fieldsetId);
  };

  fieldsetErrorCheck = (fieldsetId) => {
    const formErrorCssClass = this.cssClasses.formError;
    const fieldsetErrorCssClass = this.cssClasses.fieldsetError;
    const keys = this.fieldErrors.getKeys();
    const fieldsets = this.data.fieldsets;
    for (let i = 0; i < fieldsets.length; i++) {
      // Clean all errors
      const elem = document.getElementById(fieldsets[i].id);
      if (elem) elem.classList.remove(fieldsetErrorCssClass);
    }
    this.elem.classList.remove(formErrorCssClass); // Clean form error class
    this._setFormMsg('');

    let formErrors = false;
    for (let i = 0; i < keys.length; i++) {
      const err = this.fieldErrors.get(keys[i]);
      if (err.fieldsetId === fieldsetId) {
        // Set new field errors
        const elem = document.getElementById(fieldsetId);
        if (elem) elem.classList.add(fieldsetErrorCssClass);
        formErrors = true;
      }
    }

    if (formErrors) {
      this.elem.classList.add(formErrorCssClass); // Set form error class
      const text = this._getTextData(this.data.onErrorsMsg, this.data.onErrorsMsgId);
      if (text) this._setFormMsg(text);
    }
  };

  _getTextData(stringOrObject, langId) {
    if (stringOrObject || langId) {
      let text;
      if (stringOrObject) {
        if (typeof stringOrObject === 'string' || stringOrObject instanceof String) {
          text = stringOrObject;
        } else {
          text = stringOrObject[this.curLang];
        }
      } else {
        text = getText(langId);
      }
      return text;
    }
    return null;
  }

  handleSubmit = (e) => {
    e.preventDefault();
    if (!this.formSentOnce) {
      this.formSentOnce = true;
      this.elem.classList.add(this.cssClasses.formSent);
    }

    // Check if form does not have changes (and if the form is an edit form (has editDataId property))
    if (!this.formHasChanges && this.data.editDataId) return;

    // Check form errors
    let formHasErrors = this._checkAllFieldErrors();

    if (!formHasErrors) {
      if (this.data.beforeFormSendingFn) {
        const continues = this.data.beforeFormSendingFn();
        if (continues === false) return;
      }
      const fields = this.data.submitFields;
      const payload = {};
      for (let i = 0; i < fields.length; i++) {
        if (this.components[fields[i]] && this.components[fields[i]].value !== undefined) {
          payload[fields[i]] = this.components[fields[i]].value;
        }
      }
      this._sendForm(payload);
    }
  };

  _sendForm = async (payload) => {
    this.formState.set('sending', true);
    try {
      payload.id = this.id;
      let url = _CONFIG.apiBaseUrl + (this.data.api || '/api/forms/filled');
      let response;

      if (this.data.addToMessage) {
        const keys = Object.keys(this.data.addToMessage);
        for (let i = 0; i < keys.length; i++) {
          if (!payload[keys[i]]) payload[keys[i]] = this.data.addToMessage[keys[i]];
        }
      }

      // Get the just-in-time CSRF token
      const getCSRFPayload = { from: 'getCSRF', browserId: this.appState.get('browserId') };
      const urlCSRF = _CONFIG.apiBaseUrl + '/api/login/access';
      response = await axios.post(urlCSRF, getCSRFPayload, { withCredentials: true });
      if (!response.data || !response.data.csrfToken) {
        this.logger.error('Could not retrieve CSRF token.', response);
        throw new Error('Call stack');
      }
      payload._csrf = response.data.csrfToken;

      this.formSubmitted = true;
      if (this.data.method && this.data.method === 'PUT') {
        response = await axios.put(url, payload, { withCredentials: true });
      } else if (this.data.method && this.data.method === 'POST') {
        response = await axios.post(url, payload, { withCredentials: true });
      } else {
        this.formState.set('sending', false);
        this._setFormMsg(getText('form_submit_error'));
        this.logger.error(
          'Form sending failed (Form Creator). Method was unknown: ' + this.data.method
        );
        throw new Error('Call stack');
      }

      this.formState.set('sending', false);
      if (response.data && response.data.errors) {
        if (response.data.deletionResponse) {
          this._serverSideDeletionErrors(response);
        } else {
          this._serverSideFieldErrors(response);
        }
      } else {
        // Success
        this._resetForm();
        const showOnlyMsg = this.data.afterSubmitShowOnlyMsg;
        if (showOnlyMsg) {
          this.formSubmitted = true;
          this.reDrawSelf({
            class: this.cssClasses.formSuccess,
          });
        } else {
          const text = this._getTextData(this.data.afterSubmitMsg, this.data.afterSubmitMsgId);
          this._setFormMsg(text);
        }
        if (this.afterFormSentFn) {
          this.afterFormSentFn(response, this);
        }
      }
    } catch (exception) {
      this.exceptionError = true;
      this.formState.set('sending', false);
      if (exception.response && exception.response.status === 401) {
        if (this.data.formErrors && this.data.formErrors.error401Id) {
          if (exception.response.data && exception.response.data.errors) {
            this._serverSideFieldErrors(exception.response);
          }
          this._setFormMsg(getText(this.data.formErrors.error401Id));
        } else if (this.data.formErrors && this.data.formErrors.error401NoShow) {
          if (exception.response.data && exception.response.data.errors) {
            this._serverSideFieldErrors(exception.response);
          }
        } else {
          this._resetForm();
          this._setFormMsg(getText('unauthorised'));
        }
      } else if (exception.response && exception.response.status === 403) {
        if (this.data.formErrors && this.data.formErrors.error403Id) {
          if (exception.response.data && exception.response.data.errors) {
            this._serverSideFieldErrors(exception.response);
          }
          this._setFormMsg(getText(this.data.formErrors.error403Id));
        } else if (this.data.formErrors && this.data.formErrors.error403NoShow) {
          if (exception.response.data && exception.response.data.errors) {
            this._serverSideFieldErrors(exception.response);
          }
        } else {
          this._resetForm();
          this._setFormMsg(getText('forbidden'));
        }
      } else {
        this._resetForm();
        this._setFormMsg(getText('form_submit_error'));
        this.logger.error('Form sending failed (Form Creator).', exception);
      }
      this.elem.classList.add(this.cssClasses.formSent);
      this.elem.classList.add(this.cssClasses.formError);
      // Call outside error callback if present:
      if (this.data.onErrorsFn)
        this.data.onErrorsFn(exception, exception.response, this._setFormMsg);
    }
  };

  _loadFormData = async (id) => {
    this.formState.set('getting', true);
    this.formState.set('sending', false);
    try {
      let additionalDataId = '';
      if (this.data.editDataId) additionalDataId = '+' + this.data.editDataId;
      const url = _CONFIG.apiBaseUrl + '/api/forms/' + id + additionalDataId;
      const response = await axios.get(url, { withCredentials: true });

      // this.logger.log('API RESPONSE', response);
      this.data = Object.assign({}, this.data, response.data);
      this.formState.set('getting', false);
    } catch (exception) {
      let text,
        toLogout = false;
      if (exception.response && exception.response.status === 401) {
        text = getText('unauthorised');
        if (exception.response.data && exception.response.data.loggedIn === false) {
          toLogout = true;
        }
      } else {
        text = getText('could_not_get_form_data');
      }
      this.formState.removeListener('getting');
      this.formState.set('getting', false);
      this.formSubmitted = true;
      if (
        exception.response &&
        exception.response.data &&
        exception.response.data.customErrorTextId
      ) {
        text = getText(exception.response.data.customErrorTextId);
      }
      this.template = `<div class="error-msg">${text}</div>`;
      this.logger.error('Form data retrieving failed (Form Creator).', exception, this);
      if (this.data.onErrorsFn) this.data.onErrorsFn(exception, exception.response);
      if (toLogout) {
        setTimeout(() => {
          this.Router.changeRoute('/logout?r=' + this.Router.getRoute(true));
        }, 500);
      } else {
        this.reDrawSelf();
      }
    }
  };

  _serverSideFieldErrors = (response) => {
    // Server side validation error
    const keys = Object.keys(response.data.errors);
    for (let i = 0; i < keys.length; i++) {
      let fieldsetId;
      //Find fieldset
      for (let f = 0; f < this.data.fieldsets.length; f++) {
        const fieldset = this.data.fieldsets[f];
        for (let k = 0; k < fieldset.fields.length; k++) {
          const field = fieldset.fields[k];
          if (field.id === keys[i]) {
            fieldsetId = fieldset.id;
            break;
          }
        }
        if (fieldsetId) break;
      }
      if (response.data.errors[keys[i]] === true) {
        this.fieldErrors.set(keys[i], { errorMsg: '', fieldsetId });
      } else {
        this.fieldErrors.set(keys[i], {
          errorMsgId: response.data.errors[keys[i]],
          fieldsetId,
        });
      }
      this._displayFieldError(keys[i]);
      this.fieldsetErrorCheck(fieldsetId);
    }
    if (this.Dialog) this.Dialog.unlock();
  };

  _serverSideDeletionErrors = (response) => {
    const errors = response.data.errors;
    let errorMsg = '';
    for (let i = 0; i < errors.length; i++) {
      if (errors[i].fatal) {
        errorMsg = getText('form_submit_error');
        break;
      } else if (errors[i].userNotFoundError) {
        errorMsg += getText('user_not_found_error', [errors[i].userId]) + '\n';
      } else if (errors[i].notAllowedToDeleteUserError) {
        errorMsg += getText('not_allowed_to_delete_user_error', [errors[i].userId]) + '\n';
      }
    }
    this.formSubmitted = true;
    this._resetForm();
    this.reDrawSelf({
      class: [this.cssClasses.formError, this.cssClasses.formSent],
    });
    this._setFormMsg(errorMsg);
    if (this.data.onErrorsFn)
      this.data.onErrorsFn(new Error('Server side deletion error'), response);
    if (this.Dialog) this.Dialog.unlock();
  };

  _checkAllFieldErrors = () => {
    let formHasErrors = false;
    for (let i = 0; i < this.componentsOrder.length; i++) {
      const comp = this.components[this.componentsOrder[i]];
      if (comp.errorChecker) {
        if (!this.fieldErrors.get(comp.id)) {
          // This check is for server side errors
          // Run this check only if there aren't any errors before (this would clear server side errors)
          comp.errorChecker({
            val: comp.value,
            id: comp.id,
            field: comp.data.field,
            fieldsetId: comp.fieldsetId,
          });
        }
        this._displayFieldError(comp.id);
        if (this.fieldErrors.get(comp.id)) {
          formHasErrors = true;
        }
      }
    }
    return formHasErrors;
  };

  _displayFieldError = (id) => {
    const msg = this.fieldErrors.get(id);
    if (!this.formSentOnce || !msg) {
      this.components[id].error(false);
      return;
    }
    if (typeof msg === 'string' || msg instanceof String) {
      this.components[id].error({ errorMsg: msg });
    } else {
      const text = this._getTextData(msg.errorMsg, msg.errorMsgId);
      this.components[id].error({ errorMsg: text });
    }
  };

  _setFormMsg = (msg, showOnlyTop) => {
    const showTop = this.data.showTopMsg;
    const showBottom = this.data.showBottomMsg;
    let elem;
    if (showOnlyTop || showTop !== false) {
      elem = document.getElementById(this.id + '-msg-top');
      if (elem) elem.innerText = msg;
    }
    if (showBottom !== false) {
      elem = document.getElementById(this.id + '-msg-bottom');
      if (elem) elem.innerText = showOnlyTop ? '' : msg;
    }
  };

  _resetForm = () => {
    this.formSentOnce = false;

    // Reset all values to initValues and errors to false
    let fieldsets = this.data.fieldsets;
    if (!fieldsets) fieldsets = [];
    for (let i = 0; i < fieldsets.length; i++) {
      const fieldset = fieldsets[i];
      for (let j = 0; j < fieldset.fields.length; j++) {
        const field = fieldset.fields[j];
        let isField = false;

        if (field.type === 'textinput') {
          this.components[field.id].setValue(
            field.maxLength && field.initValue
              ? field.initValue.substring(0, parseInt(field.maxLength)) || ''
              : field.initValue || ''
          );
          isField = true;
        } else if (field.type === 'checkbox') {
          this.components[field.id].setValue(field.initValue ? true : false);
          isField = true;
        } else if (field.type === 'dropdown') {
          this.components[field.id].setValue(field.initValue);
          isField = true;
        }

        if (isField) {
          this.fieldErrors.set(field.id, false);
          this.components[field.id].data.disabled = field.disabled;
          this.components[field.id].rePaint();
        }
      }
      this.fieldsetErrorCheck(fieldset.id);
    }

    this.elem.classList.remove(this.cssClasses.formSent);
    this.elem.classList.remove(this.cssClasses.formError);
    this.elem.classList.remove(this.cssClasses.formSuccess);
  };
}

export default FormCreator;
