import { USER } from '../../CONFIG.js';

const newUserFormData = {
  formId: 'new-user-form',
  path: '/api/users',
  method: 'POST',
  type: 'form',
  useRightsLevel: 0,
  useRightsUsers: [],
  useRightsGroups: [],
  editorRightsLevel: 8,
  editorRightsUsers: [],
  editorRightsGroups: [],
  editorOptions: {
    newUserLevel: {
      labelId: 'new_user_level',
      type: 'select-user-level',
      value: 2,
    },
  },
  form: {
    formTitleId: 'register_new_user',
    onErrorsMsgId: 'form_has_errors',
    afterSubmitMsgId: 'new_user_registered',
    afterSubmitShowOnlyMsg: true,
    submitButton: {
      id: 'submit-new-user-button-id',
      labelId: 'create_new_user_button',
    },
    submitFields: ['username', 'name', 'email', 'password'],
    fieldsets: [
      {
        // FIELDSET
        id: 'new-user-main-fs',
        fields: [
          { type: 'divider' },
          {
            // USERNAME
            type: 'textinput',
            id: 'username',
            labelId: 'username',
            required: true,
            minLength: USER.username.minLength,
            maxLength: 24,
            regex:
              '^[a-zA-Z0-9åöäñüéèêâîôûčßàìòùóçęįųķļņģëïõžšæøėēūāīÅÖÄÑÜÉÈÊÂÎÔÛČẞÀÌÒÙÓÇĘĮŲĶĻŅĢËÏÕŽŠÆØĖĒŪĀĪ]+$', // Current langs: finnish, english, swedish, norwegian, danish, german, french, spanish, italian, estonian, latvian, lithuanian
            regexErrorMsgId: 'username_invalid_characters',
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
            // PASSWORD
            type: 'textinput',
            id: 'password',
            labelId: 'password',
            required: true,
            minLength: USER.password.minLength,
            maxLength: 50,
            password: true,
            validationFn: 'validatePass1',
          },
          {
            // PASSWORD AGAIN
            type: 'textinput',
            id: 'password-again',
            labelId: 'password_again',
            required: true,
            minLength: 0,
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

export default newUserFormData;
