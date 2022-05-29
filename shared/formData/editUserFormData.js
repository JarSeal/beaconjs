import { USER } from '../../CONFIG.js';

const editUserFormData = {
  formId: 'edit-user-form',
  path: '/api/users',
  method: 'PUT',
  type: 'form',
  useRightsLevel: 8,
  useRightsUsers: [],
  useRightsGroups: [],
  editorRightsLevel: 8,
  editorRightsUsers: [],
  editorRightsGroups: [],
  form: {
    onErrorsMsgId: 'form_has_errors',
    afterSubmitMsg: '',
    afterSubmitShowOnlyMsg: true,
    submitButton: {
      id: 'submit-edit-user-button-id',
      labelId: 'save',
      class: 'save-button',
    },
    submitFields: ['userId', 'name', 'email', 'userLevel'],
    fieldsets: [
      {
        // FIELDSET
        id: 'edit-user-main-fs',
        fields: [
          { type: 'divider' },
          {
            // USERNAME
            type: 'textinput',
            id: 'username',
            labelId: 'username',
            disabled: true,
          },
          {
            // NAME
            type: 'textinput',
            id: 'name',
            labelId: 'name',
            required: USER.name.required,
            minLength: USER.name.minLength,
            maxLength: 40,
            regex:
              '[a-zA-ZåöäñüéèêâîôûčßàìòùóçęįųķļņģëïõžšæøėēūāīÅÖÄÑÜÉÈÊÂÎÔÛČẞÀÌÒÙÓÇĘĮŲĶĻŅĢËÏÕŽŠÆØĖĒŪĀĪ]+$', // Current langs: finnish, english, swedish, norwegian, danish, german, french, spanish, italian, estonian, latvian, lithuanian
            regexErrorMsgId: 'field_has_invalid_characters',
          },
          { type: 'divider' },
          {
            // EMAIL
            type: 'textinput',
            id: 'email',
            labelId: 'email',
            required: USER.email.required,
            maxLength: 50,
            email: true,
          },
          { type: 'divider' },
          {
            // USERLEVEL
            type: 'dropdown',
            id: 'userLevel',
            labelId: 'user_level',
            required: true,
            getOptionsFn: 'userLevels',
            minValue: 1,
            maxValue: 8,
          },
          { type: 'divider' },
        ],
      },
    ],
  },
};

export default editUserFormData;
