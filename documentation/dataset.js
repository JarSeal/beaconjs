/* eslint-disable no-unused-vars */

// Documentation:
// Example of a Dataset

const dataset = {
  type: 'raw-text', // String [required], a data type id
  universeId: 'my-universe-id',
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
  value: 'Some text without formatting...', // String / Array / Object / Number (no functions)
  rights: {
    public: false, // Boolean
    readRightUsers: [], // Array[mongo user _id] or String (can be the string 'inherit')
    readRightGroups: [], // Array[mongo group _id] or String
    editRightUsers: [], // Array[mongo user _id] or String
    editRightGroups: [], // Array[mongo group _id] or String
    deleteRightUsers: [], // Array[mongo user _id] or String
    deleteRightGroups: [], // Array[mongo group _id] or String
  },
};
