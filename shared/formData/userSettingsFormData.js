const adminSettingsFormData = {
  formId: 'user-settings-form',
  path: '/api/settings',
  method: 'PUT',
  type: 'form',
  useRightsLevel: 2,
  useRightsUsers: [],
  useRightsGroups: [],
  editorRightsLevel: 8,
  editorRightsUsers: [],
  editorRightsGroups: [],
  form: {
    onErrorsMsgId: 'form_has_errors',
    afterSubmitMsg: '',
    afterSubmitShowOnlyMsg: true,
    singleEdit: true,
    submitButton: {
      id: 'submit-user-settings-button-id',
      labelId: 'save',
      class: 'save-button',
    },
    submitFields: ['table-sorting-setting', 'enable-user-2fa-setting'],
    fieldsets: [
      {
        // Tables
        id: 'user-settings-tables-fs',
        fieldsetTitleId: 'tables',
        fields: [
          {
            // Table sort and filter
            type: 'dropdown',
            id: 'table-sorting-setting',
            labelId: 'table_sorting_memory',
            descriptionId: 'table_sorting_memory_desc',
            settingType: 'string',
            defaultValue: 'none',
            options: [
              { value: 'none', labelId: 'none' },
              { value: 'session', labelId: 'save_for_this_session' },
              { value: 'browser', labelId: 'save_for_this_browser' },
            ],
          },
        ],
      },
      {
        // Security
        id: 'user-settings-security-fs',
        fieldsetTitleId: 'security',
        fields: [
          {
            // 2-factor authentication
            type: 'checkbox',
            id: 'enable-user-2fa-setting',
            labelId: 'two_factor_authentication',
            enabledId: 'use-two-factor-authentication',
            descriptionId: 'user_two_factor_authentication_desc',
            defaultValue: false,
            settingType: 'boolean',
          },
        ],
      },
    ],
  },
};

export default adminSettingsFormData;
