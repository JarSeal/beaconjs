import { USER } from '../../CONFIG.js';

const newPassWTokenFormData = {
  formId: 'reset-password-w-token-form',
  path: '/api/users/newpass',
  method: 'POST',
  type: 'form',
  useRightsLevel: 0,
  useRightsUsers: [],
  useRightsGroups: [],
  editorRightsLevel: 8,
  editorRightsUsers: [],
  editorRightsGroups: [],
  form: {
    onErrorsMsgId: 'form_has_errors',
    showBottomMsg: false,
    afterSubmitMsgId: 'password_has_been_changed',
    afterSubmitShowOnlyMsg: true,
    submitButton: {
      id: 'submit-new-pass-w-token-button-id',
      labelId: 'save',
      class: 'save-button',
    },
    submitFields: ['password'],
    fieldsets: [
      {
        // FIELDSET
        id: 'new-password-w-token-main-fs',
        fields: [
          { type: 'divider' },
          {
            // NEW PASSWORD
            type: 'textinput',
            id: 'password',
            labelId: 'new_password',
            required: true,
            minLength: USER.password.minLength,
            maxLength: 50,
            password: true,
            validationFn: 'validatePass1',
          },
          {
            // NEW PASSWORD AGAIN
            type: 'textinput',
            id: 'password-again',
            labelId: 'new_password_again',
            required: true,
            minLength: 0,
            maxLength: 50,
            password: true,
            validationFn: 'validatePass2',
          },
        ],
      },
    ],
  },
};

export default newPassWTokenFormData;
