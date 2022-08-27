import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

const formSchema = mongoose.Schema({
  formId: {
    type: String,
    required: true,
    unique: true,
  },
  path: String,
  method: { type: String, default: 'GET' },
  type: {
    type: String,
    required: true,
  },
  useRightsLevel: {
    type: Number,
    required: true,
  },
  admin: Boolean,
  useRightsUsers: [{ type: mongoose.Schema.Types.ObjectId }],
  useRightsGroups: [{ type: String }],
  editorRightsLevel: {
    type: Number,
    required: true,
  },
  editorRightsUsers: [{ type: mongoose.Schema.Types.ObjectId }],
  editorRightsGroups: [{ type: String }],
  editorOptions: {
    type: Object,
  },
  form: {
    type: Object,
  },
  created: {
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    autoCreated: Boolean,
    date: Date,
  },
  edited: [
    {
      _id: false,
      by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      autoEdited: Boolean,
      date: Date,
    },
  ],
});

formSchema.plugin(uniqueValidator);
formSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const Form = mongoose.model('Form', formSchema, 'forms');

export default Form;
