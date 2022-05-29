import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

const universeSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  universeId: {
    type: String,
    required: true,
    unique: true,
  },
  description: String,
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
  access: {
    readLevel: Number,
    writeLevel: Number,
    deleteLevel: Number,
    readUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    writeUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    deleteUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    readGroups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    writeGroups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    deleteGroups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
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
});

universeSchema.plugin(uniqueValidator);
universeSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const Universe = mongoose.model('Universe', universeSchema, 'universes');

export default Universe;
