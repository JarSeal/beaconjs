/* eslint-disable no-unused-vars */

// Documentation:
// Example of a Universe

const universe = {
  title: 'My Project Title', // String [required]
  universeId: 'my-project-id', // String [required, unique, regex='^[a-zA-Z0-9\-_]+$']
  description: 'Some project description...', // String
  rights: {
    public: false, // Boolean
    readRightUsers: [], // Array[mongo user _id]
    readRightGroups: [], // Array[mongo group _id]
    editRightUsers: [], // Array[mongo user _id]
    editRightGroups: [], // Array[mongo group _id]
    deleteRightUsers: [], // Array[mongo user _id]
    deleteRightGroups: [], // Array[mongo group _id]
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
