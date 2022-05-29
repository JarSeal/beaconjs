/* eslint-disable no-unused-vars */

// Documentation:
// Example of a Beacon

const beacon = {
  title: 'My Beacon Title', // String [required]
  beaconId: 'my-beacon-id', // String [required, unique, regex='^[a-zA-Z0-9\-_]+$']
  description: 'Some beacon description...', // String
  universeId: 'my-universe-id', // String, auto-added when beacon is created
  structureId: 'my-structure-id', // String, auto-added when beacon is created
  allowedTypes: null, // null / Array[String], if null then any data type is allowed
  typeConfigurations: null, // Object(with data type keys and configs as values), this is filled with allowed type configurations (eg. if type is form data, then the fields will be here)
  fillFromTop: false, // Boolean, if true the data will be prepended to the beginning of the array (default false = append)
  data: [
    '[mongo dataset _id 1]', // Referring to a dataset with this mongo _id
    '[mongo dataset _id 2]', // Order of data comes from the array
  ],
  size2d: {
    w: 32, // Number [required]
    h: 32, // Number [required]
  },
  pos2d: {
    x: 0, // Number [required]
    y: 0, // Number [required]
  },
  rights: {
    public: false, // Boolean
    readRightUsers: [], // Array[mongo user _id] or String (can be the string 'inherit')
    readRightGroups: [], // Array[mongo group _id] or String
    editRightUsers: [], // Array[mongo user _id] or String
    editRightGroups: [], // Array[mongo group _id] or String
    deleteRightUsers: [], // Array[mongo user _id] or String
    deleteRightGroups: [], // Array[mongo group _id] or String
  },
  created: {
    by: '[mongo user _id]', // String [required], mongo user id
    date: Date, // Date [required]
  },
  edited: [
    {
      by: '[mongo user _id]',
      date: Date,
    },
  ],
  owner: {
    user: '[mongo user _id]', // String [required], mongo user id
  },
};
beacon;

// Data types are hard-coded, non-changing definitions on the server (not in mongo)
// Only the config part is customised by the user when the data type is used in a beacon
const dataTypes = [
  {
    dataTypeId: 'raw-text',
    title: 'Raw Text', // This will show when selecting a data type for a beacon
    description: '',
    config: {
      // Config fields when creating a beacon with this type
      minLength: 'numberint',
      maxLength: 'numberint',
      required: 'checkbox',
      label: 'textinput',
      regex: 'textinput', // Maybe later add a regex form type
      regexErrorMsg: 'textinput',
    },
    valueThumbFn: (data) => {
      return data.value.substring(0, 11) + '...';
    },
    valueFn: (data) => {
      return data.value;
    },
  },
  {
    dataTypeId: 'form-data',
    title: 'Form Data',
    description: '',
    config: {
      fields: [
        {
          type: 'textinput',
          // ...requirements, regex, options, etc. (same field options as forms have)
        },
        // ...rest of fields that are setup when the beacon is created
      ],
    },
    valueThumbFn: (data) => {
      return `${data.config.fields.length} Fields`;
    },
    valueFn: (data) => {
      return data.value;
    },
  },
];
