import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

import UserGroup from './userGroup.js';
import shared from '../shared/index.js';

const CONFIG = shared.CONFIG.USER;
UserGroup;

mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

const emailType = {
  type: String,
  required: CONFIG.email.required,
  unique: CONFIG.email.required, // If required, has to be also unique
  minlength: 5,
  index: true,
};

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: CONFIG.username.minLength,
    index: true,
  },
  name: {
    type: String,
    required: CONFIG.name.required,
    minlength: CONFIG.name.minLength,
    index: true,
  },
  email: emailType,
  passwordHash: String,
  userLevel: {
    type: Number,
    required: true,
    minlength: 1,
    maxlength: 1,
  },
  created: {
    by: {
      type: mongoose.Schema.Types.ObjectId,
    },
    publicForm: Boolean,
    date: Date,
  },
  edited: [
    {
      _id: false,
      by: {
        type: mongoose.Schema.Types.ObjectId,
      },
      date: Date,
    },
  ],
  security: {
    loginAttempts: Number,
    coolDown: Boolean,
    coolDownStarted: Date,
    lastLogins: [
      {
        _id: false,
        date: Date,
        browserId: String,
      },
    ],
    lastAttempts: [
      {
        _id: false,
        date: Date,
      },
    ],
    newPassLink: {
      token: {
        type: String,
        index: true,
      },
      expires: {
        type: Date,
      },
      sent: {
        type: Date,
      },
    },
    verifyEmail: {
      token: {
        type: String,
        index: true,
      },
      oldEmail: {
        type: String,
        minlength: 5,
        index: true,
      },
      verified: Boolean,
    },
    twoFactor: {
      expires: Date,
      code: String,
    },
  },
  exposure: {
    username: Number,
    name: Number,
    email: Number,
    userLevel: Number,
    created_date: Number,
  },
});

userSchema.plugin(uniqueValidator);
userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.passwordHash;
  },
});

const User = mongoose.model('User', userSchema, 'users');

export default User;
