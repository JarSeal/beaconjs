const options = [
  { value: 0, labelId: 'view_right_0' },
  { value: 1, labelId: 'view_right_1' },
  { value: 2, labelId: 'view_right_2' },
];

const editExposeProfileFormData = {
  formId: 'edit-expose-profile-form',
  path: '/api/users/user/exposure',
  method: 'PUT',
  type: 'form',
  useRightsLevel: 1,
  useRightsUsers: [],
  useRightsGroups: [],
  editorRightsLevel: 8,
  editorRightsUsers: [],
  editorRightsGroups: [],
  editorOptions: {
    labelId_showToUsers: 'show_to_users',
    showToUsers: {
      username: {
        labelId: 'username',
        type: 'checkbox',
        value: true,
      },
      name: {
        labelId: 'name',
        type: 'checkbox',
        value: true,
      },
      email: {
        labelId: 'email',
        type: 'checkbox',
        value: true,
      },
      created_date: {
        labelId: 'created',
        type: 'checkbox',
        value: true,
      },
    },
  },
  form: {
    formDescId: 'edit_expose_profile_form_desc',
    onErrorsMsgId: 'form_has_errors',
    formErrors: {
      error401Id: 'wrong_password',
    },
    showBottomMsg: false,
    submitButton: {
      id: 'submit-edit-profile-button-id',
      labelId: 'save',
      class: 'save-button',
    },
    submitFields: ['username', 'name', 'email', 'created_date', 'curPassword'],
    fieldsets: [
      {
        // FIELDSET
        id: 'edit-user-main-fs',
        fields: [
          { type: 'divider' },
          {
            // USERNAME
            type: 'dropdown',
            id: 'username',
            labelId: 'username',
            disabled: true,
            defaultValue: 0,
            options,
          },
          {
            // NAME
            type: 'dropdown',
            id: 'name',
            labelId: 'name',
            defaultValue: 1,
            options,
          },
          { type: 'divider' },
          {
            // EMAIL
            type: 'dropdown',
            id: 'email',
            labelId: 'email',
            disabled: true,
            defaultValue: 2,
            options,
          },
          { type: 'divider' },
          {
            // CREATED.DATE
            type: 'dropdown',
            id: 'created_date',
            labelId: 'created',
            defaultValue: 2,
            options,
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

export default editExposeProfileFormData;
