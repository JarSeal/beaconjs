import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

const adminSettingSchema = mongoose.Schema({
  settingId: {
    type: String,
    required: true,
  },
  value: {
    type: String,
  },
  defaultValue: {
    type: String,
  },
  settingReadRight: {
    type: Number,
    required: true,
    minlength: 1,
    maxlength: 1,
  },
  type: {
    type: String,
    required: true,
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
  password: {
    type: Boolean,
  },
});

adminSettingSchema.plugin(uniqueValidator);
adminSettingSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.passwordHash;
  },
});

const AdminSetting = mongoose.model('AdminSetting', adminSettingSchema, 'adminsettings');

export default AdminSetting;
