const newPassRequestFormData = {
  formId: 'new-pass-request-form',
  path: '/api/users/newpassrequest',
  method: 'POST',
  type: 'form',
  useRightsLevel: 0,
  useRightsUsers: [],
  useRightsGroups: [],
  editorRightsLevel: 8,
  editorRightsUsers: [],
  editorRightsGroups: [],
  editorOptions: {},
  form: {
    formTitleId: 'request_new_password_link',
    afterSubmitMsgId: 'request_new_password_link_processed_msg',
    afterSubmitShowOnlyMsg: true,
    showTopMsg: true,
    showBottomMsg: false,
    submitButton: {
      id: 'request-new-pass-button-id',
      labelId: 'request',
    },
    submitFields: ['email'],
    fieldsets: [
      {
        // FIELDSET
        id: 'new-user-main-fs',
        fields: [
          { type: 'divider' },
          {
            // EMAIL
            type: 'textinput',
            id: 'email',
            labelId: 'email',
            required: true,
            maxLength: 50,
            email: true,
          },
          { type: 'divider' },
        ],
      },
    ],
  },
};

export default newPassRequestFormData;
