const loginBeaconFormData = {
  formId: 'beacon-main-login',
  path: '/api/login',
  method: 'POST',
  type: 'form',
  useRightsLevel: 0,
  useRightsUsers: [],
  useRightsGroups: [],
  editorRightsLevel: 8,
  editorRightsUsers: [],
  editorRightsGroups: [],
  editorOptions: {
    loginAccessLevel: {
      labelId: 'login_access_level',
      type: 'select-user-level',
      value: 2,
    },
  },
  form: {
    onErrorsMsgId: 'login_error_empty',
    formErrors: {
      error401Id: 'login_error_wrong',
      error403NoShow: true,
    },
    showBottomMsg: false,
    submitButton: {
      id: 'submit-button',
      labelId: 'login',
    },
    submitFields: ['username', 'password', 'remember-me'],
    fieldsets: [
      {
        id: 'main-fieldset-beacon-login',
        fields: [
          {
            type: 'textinput',
            id: 'username',
            labelId: 'username',
            required: true,
            maxLength: 32,
            hideMsg: true,
          },
          {
            type: 'textinput',
            id: 'password',
            labelId: 'password',
            required: true,
            maxLength: 64,
            password: true,
            hideMsg: true,
          },
          {
            type: 'checkbox',
            id: 'remember-me',
            labelId: 'login_remember_me',
          },
          { type: 'divider' },
        ],
      },
    ],
  },
};

export default loginBeaconFormData;
