const readUsersFormData = {
  formId: 'delete-users',
  path: '/api/users/delete',
  method: 'POST',
  type: 'form',
  useRightsLevel: 8,
  useRightsUsers: [],
  useRightsGroups: [],
  editorRightsLevel: 8,
  editorRightsUsers: [],
  editorRightsGroups: [],
  form: {
    class: 'confirmation-form',
    afterSubmitShowOnlyMsg: true,
    submitButton: {
      id: 'delete-users-button',
      labelId: 'delete',
      class: 'confirm-button--delete',
    },
    submitFields: ['users'],
  },
};

export default readUsersFormData;
