const emailVerificationFormData = {
  formId: 'new-email-verification',
  path: '/api/users/newemailverification',
  method: 'POST',
  type: 'form',
  useRightsLevel: 1,
  useRightsUsers: [],
  useRightsGroups: [],
  editorRightsLevel: 8,
  editorRightsUsers: [],
  editorRightsGroups: [],
  form: {
    formDescId: 'new_verification_form_description',
    class: 'confirmation-form',
    afterSubmitShowOnlyMsg: true,
    submitButton: {
      id: 'new-email-verification-button',
      labelId: 'send',
    },
    submitFields: [],
  },
};

export default emailVerificationFormData;
