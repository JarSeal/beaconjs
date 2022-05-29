const loginTwoFABeaconFormData = {
  formId: 'beacon-twofa-login',
  path: '/api/login/two',
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
    formDescId: 'login_twofa_description',
    onErrorsMsgId: 'login_twofa_error_empty',
    formErrors: {
      error401Id: 'login_twofa_error_wrong',
      error403NoShow: true,
    },
    showBottomMsg: false,
    submitButton: {
      id: 'submit-button',
      labelId: 'login',
    },
    submitFields: ['twofacode'],
    fieldsets: [
      {
        id: 'main-fieldset-beacon-login-twofa',
        fields: [
          {
            type: 'textinput',
            id: 'twofacode',
            labelId: 'code',
            required: true,
            maxLength: 6,
            hideMsg: true,
          },
          { type: 'divider' },
        ],
      },
    ],
  },
};

export default loginTwoFABeaconFormData;
