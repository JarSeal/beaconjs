const deleteProfileFormData = {
  formId: 'delete-profile-form',
  path: '/api/users/own/delete',
  method: 'POST',
  type: 'form',
  useRightsLevel: 1,
  useRightsUsers: [],
  useRightsGroups: [],
  editorRightsLevel: 8,
  editorRightsUsers: [],
  editorRightsGroups: [],
  form: {
    formDescId: 'delete_profile_warning_text',
    onErrorsMsgId: 'form_has_errors',
    formErrors: {
      error401Id: 'wrong_password',
      error403Id: 'this_user_cannot_be_deleted',
    },
    showBottomMsg: false,
    submitButton: {
      id: 'submit-delete-profile-button-id',
      labelId: 'delete',
      class: 'confirm-button--delete',
    },
    submitFields: ['password'],
    fieldsets: [
      {
        // FIELDSET
        id: 'delete-profile-main-fs',
        fields: [
          { type: 'divider' },
          {
            // PASSWORD
            type: 'textinput',
            id: 'password',
            labelId: 'current_password',
            required: true,
            maxLength: 50,
            password: true,
            validationFn: 'validatePass1',
          },
          {
            // PASSWORD AGAIN
            type: 'textinput',
            id: 'password-again',
            labelId: 'current_password_again',
            required: true,
            maxLength: 50,
            password: true,
            validationFn: 'validatePass2',
          },
          { type: 'divider' },
        ],
      },
    ],
  },
};

export default deleteProfileFormData;
