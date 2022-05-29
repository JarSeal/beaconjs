import { USER } from '../../CONFIG.js';

const changePasswordFormData = {
  formId: 'change-password-form',
  path: '/api/users/own/changepass',
  method: 'POST',
  type: 'form',
  useRightsLevel: 1,
  useRightsUsers: [],
  useRightsGroups: [],
  editorRightsLevel: 8,
  editorRightsUsers: [],
  editorRightsGroups: [],
  form: {
    onErrorsMsgId: 'form_has_errors',
    formErrors: {
      error401Id: 'wrong_password',
    },
    showBottomMsg: false,
    submitButton: {
      id: 'submit-change-pass-button-id',
      labelId: 'save',
      class: 'save-button',
    },
    submitFields: ['password', 'curPassword'],
    fieldsets: [
      {
        // FIELDSET
        id: 'change-password-main-fs',
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
          { type: 'divider' },
          {
            // CURRENT PASSWORD
            type: 'textinput',
            id: 'curPassword',
            labelId: 'current_password',
            required: true,
            maxLength: 50,
            password: true,
          },
          { type: 'divider' },
        ],
      },
    ],
  },
};

export default changePasswordFormData;
