// This shows all the possible

const testFormData = {
  // FORM
  id: 'test-form', // String [required]
  api: null, // String (api path for the form to be sent to)
  update: false, // Boolean (whether the api uses 'post' or 'put' as api method, update: true = 'put')
  class: ['css-class-name'], // String / Array
  formTitle: { en: 'Form title', fi: 'Lomakkeen otsikko' }, // Lang object / String
  formTitleId: 'route_title_new_user', // String (transalation id for getText)
  formDesc: { en: 'Form description', fi: 'Lomakkeen kuvausteksti' }, // Lang object / String
  formDescId: 'login_error_empty', // String (transalation id for getText)
  showTopMsg: true, // Boolean (default is true)
  showBottomMsg: true, // Boolean (default is true)
  onErrorsMsg: { en: 'Form has errors.', fi: 'Lomakkeessa on virheitä' }, // Lang object / String
  onErrorsMsgId: 'form_has_errors', // String (transalation id for getText)
  formErrors: {
    error401Id: 'login_error_wrong', // String (transalation id for getText)
    error403NoShow: true, // Boolean (use custom errors)
  },
  afterSubmitMsg: { en: 'Form sent', fi: 'Lomake lähetetty' }, // Lang object / String
  afterSubmitMsgId: 'form_sent', // String (transalation id for getText)
  afterSubmitShowOnlyMsg: true, // Boolean
  singleEdit: false, // Boolean
  submitButton: {
    id: 'submit-button-id', // String
    label: { en: 'Submit', fi: 'Lähetä' }, // Lang object / String
    labelId: 'submit', // String (transalation id for getText),
    class: 'submit-button-extra-class', // String / Array
  },
  submitFields: ['text-input-0', 'checkbox-0', 'dropdown-0'], // Array[String] (field ids)
  fieldsets: [
    // Array[Object] [required]
    {
      // FIELDSET
      id: 'test-fieldset', // String [required]
      class: ['css-class-name2'], // String / Array
      fieldsetTitle: { en: 'Section title', fi: 'Osion otsikko' }, // Lang object / String
      fieldsetTitleId: 'route_title_new_user', // String (transalation id for getText)
      fieldsetDesc: { en: 'Section description', fi: 'Osion kuvaus' }, // Lang object / String
      fieldsetDescId: 'fix_issues_on_form', // String (transalation id for getText)
      disabled: false, // Boolean
      // canCollapse: true, // Boolean (whether the fieldset can be collapsed or opened)
      // collapsed: false, // Boolean
      fields: [
        {
          // DIVIDER
          type: 'divider', // String [required]
          class: 'some-divider-class', // String / Array
        },
        {
          // SUB HEADING
          type: 'subheading', // String [required]
          class: 'some-subheading-class', // String / Array
          content: { en: 'Sub Heading', fi: 'Alaotsikko' }, // Lang object / String
          contentId: 'password', // String (translation id for getText)
        },
        {
          // TEXT INPUT
          type: 'textinput', // String [required]
          id: 'text-input-0', // String
          name: 'text-input-0', // String
          password: false, // Boolean
          class: ['css-class-name3'], // String / Array
          label: { en: 'Text input', fi: 'Tekstin syöttö' }, // Lang object / String
          labelId: 'some_translation_id', // String (Transalation id for getText)
          placeholder: { en: 'Text placeholder', fi: 'Tekstin paikka' }, // Lang object / String
          placeholderId: 'some_translation_id', // String (transalation id for getText)
          required: true, // Boolean
          email: true, // Boolean (validates emails)
          minLength: 3, // Number
          maxLength: 10, // Number/String
          disabled: false, // Boolean
          initValue: '', // String/Number
          validationFn: '', // validationFn id / String
          // regex: '', // String (is called with 'new RegExp(String)')
          // regexErrorMsg: { en: 'Wrong format', fi: 'Väärä muoto' } // Lang object / String
          // regexErrorMsgId: 'some_translation_id', // String (Transalation id for getText)
          // locked: false, // Boolean (whether the field can be edited or not)
        },
        {
          // CHECKBOX
          type: 'checkbox', // String [required]
          id: 'checkbox-0', // String
          name: 'checkbox-0', // String
          class: ['css-class-name4'], // String / Array
          label: { en: 'Checkbox', fi: 'Checkboxi' }, // Lang object / String
          labelId: 'some_translation_id', // String (transalation id for getText)
          required: false, // Boolean
          disabled: false, // Boolean
          initValue: false, // Boolean (whether the box is prechecked or not)
          validationFn: '', // validationFn id / String
          // locked: false, // Boolean (whether the field can be edited or not)
        },
        {
          // DROPDOWN
          type: 'dropdown', // String [required]
          id: 'dropdown-0', // String
          name: 'dropdown-0', // String
          class: 'some-css-class-for-dropdown', // String / Array
          label: { en: 'Dropdown', fi: 'Valikko' }, // Lang object / String
          labelId: 'some_translation_id', // String (transalation id for getText)
          options: [
            // Array[Object] (Object = { value: String / Number, label: Lang object / String, labelId: String, disabled: Boolean })
            { value: '1', label: 'One' },
            { value: '2', labelId: 'required' },
            { value: 3, label: { en: 'Three', fi: 'kolme' } },
            { value: '4', label: 'Four', disabled: true },
            { value: '5', label: 'Five' },
          ],
          getOptionsFn: '', // getOptionsFn id / String (if the options are missing, then a function can be used to retrieve the options)
          minValue: 1, // Number (when min and maxValue are defined, all the values have to be numbers)
          maxValue: 100, // Number (min and maxValue are for backend validation)
          emptyIsAnOption: true, // Boolean
          required: true, // Boolean
          disabled: false, // Boolean
          initValue: '', // String
          validationFn: '', // validationFn id / String
          // locked: false, // Boolean (whether the field can be edited or not)
        },
      ],
    },
  ],
};

export default testFormData;
