import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

const formSchema = mongoose.Schema({
  formId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  path: {
    type: String,
    index: true,
  },
  method: {
    type: String,
    default: 'GET',
  },
  type: {
    type: String,
    required: true,
  },
  useRightsLevel: {
    type: Number,
    required: true,
  },
  useRightsUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', _id: false }],
  useRightsGroups: [{ type: String, _id: false }], // TODO: change to object ID when Groups are implemented
  editorRightsLevel: {
    type: Number,
    required: true,
  },
  editorRightsUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', _id: false }],
  editorRightsGroups: [{ type: String, _id: false }], // TODO: change to object ID when Groups are implemented
  editorOptions: {
    type: Object,
  },
  form: {
    type: Object,
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created: {
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    autoCreated: Boolean,
    date: Date,
  },
  edited: [
    {
      _id: false,
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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
