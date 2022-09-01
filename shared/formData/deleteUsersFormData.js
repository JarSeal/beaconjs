const readUsersFormData = {
  formId: 'delete-users',
  path: '/users/delete',
  method: 'POST',
  type: 'sys-formapi',
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
