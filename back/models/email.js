import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

const emailSchema = mongoose.Schema({
  emailId: {
    type: String,
    required: true,
    unique: true,
  },
  created: {
    by: {
      type: mongoose.Schema.Types.ObjectId,
    },
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
  fromName: {
    type: String,
    required: true,
  },
  defaultEmail: {
    subject: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  langs: {
    type: Object,
  },
});

emailSchema.plugin(uniqueValidator);
emailSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.passwordHash;
  },
});

const Email = mongoose.model('Email', emailSchema, 'emails');

export default Email;
