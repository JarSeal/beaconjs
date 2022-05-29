const newUniverseFormData = {
  formId: 'new-universe-form',
  path: '/api/universes',
  method: 'POST',
  type: 'form',
  useRightsLevel: 2,
  useRightsUsers: [],
  useRightsGroups: [],
  editorRightsLevel: 8,
  editorRightsUsers: [],
  editorRightsGroups: [],
  form: {
    onErrorsMsgId: 'form_has_errors',
    afterSubmitShowOnlyMsg: true,
    submitButton: {
      id: 'submit-new-universe-button',
      labelId: 'create_new_universe',
    },
    submitFields: ['universeTitle', 'universeId', 'universeDescription'],
    fieldsets: [
      {
        id: 'main-fieldset-new-uni',
        fields: [
          { type: 'divider' },
          {
            // TITLE / NAME
            type: 'textinput',
            id: 'universeTitle',
            labelId: 'name',
            required: true,
            minLength: 1,
            maxLength: 40,
            regex:
              '[a-zA-ZåöäñüéèêâîôûčßàìòùóçęįųķļņģëïõžšæøėēūāīÅÖÄÑÜÉÈÊÂÎÔÛČẞÀÌÒÙÓÇĘĮŲĶĻŅĢËÏÕŽŠÆØĖĒŪĀĪ]+$', // Current langs: finnish, english, swedish, norwegian, danish, german, french, spanish, italian, estonian, latvian, lithuanian
            regexErrorMsgId: 'field_has_invalid_characters',
          },
          { type: 'divider' },
          {
            // UNIVERSE ID
            type: 'textinput',
            id: 'universeId',
            labelId: 'new_universe_id',
            required: true,
            minLength: 1,
            maxLength: 40,
            regex: '^[a-zA-Z0-9-_]+$',
            regexErrorMsgId: 'field_has_invalid_characters',
          },
          { type: 'divider' },
          {
            // DESCRIPTION
            type: 'textarea',
            id: 'universeDescription',
            labelId: 'description',
            maxLength: 500,
          },
          { type: 'divider' },
        ],
      },
    ],
  },
};

export default newUniverseFormData;
