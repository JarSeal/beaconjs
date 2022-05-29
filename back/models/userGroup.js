import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

const userGroupSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  groupId: {
    type: String,
    required: true,
    unique: true,
  },
  level: {
    type: Number,
    required: true,
  },
  created: {
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    autoCreated: Boolean,
    date: Date,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  edited: [
    {
      _id: false,
      by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      date: Date,
    },
  ],
  managers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
});

userGroupSchema.plugin(uniqueValidator);
userGroupSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const UserGroup = mongoose.model('UserGroup', userGroupSchema, 'usergroups');

export default UserGroup;
