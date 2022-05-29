import CryptoJS from 'crypto-js';

import logger from '../../utils/logger.js';
import Form from '../../models/form.js';
import AdminSetting from '../../models/adminSetting.js';
import Email from '../../models/email.js';
import shared from '../../shared/index.js';

const formData = shared.formData;
const emailData = shared.emailData;
const routeAccess = shared.CONFIG.ROUTE_ACCESS;

const createPresetForms = async () => {
  let newForm, checkForm, adminSettings;
  for (let i = 0; i < formData.length; i++) {
    checkForm = await Form.findOne({ formId: formData[i].formId });
    if (formData[i].formId === 'admin-settings-form') adminSettings = formData[i];
    if (!checkForm) {
      formData[i].created = {
        by: null,
        autoCreated: true,
        date: new Date(),
      };
      newForm = new Form(formData[i]);
      await newForm.save();
      logger.log(`Preset form '${formData[i].formId}' created.`);
    }
  }
  for (let i = 0; i < routeAccess.length; i++) {
    checkForm = await Form.findOne({ formId: routeAccess[i].formId });
    if (!checkForm) {
      routeAccess[i].created = {
        by: null,
        autoCreated: true,
        date: new Date(),
      };
      routeAccess[i].type = 'view';
      newForm = new Form(routeAccess[i]);
      await newForm.save();
      logger.log(`Preset form (route access) '${routeAccess[i].formId}' created.`);
    }
  }

  // Create admin settings
  if (adminSettings) {
    const adminFieldsets = adminSettings.form.fieldsets;
    let settingsSaved = 0;
    for (let i = 0; i < adminFieldsets.length; i++) {
      const fs = adminFieldsets[i];
      for (let j = 0; j < fs.fields.length; j++) {
        const field = fs.fields[j];
        const checkField = await AdminSetting.findOne({ settingId: field.id });
        if (!checkField) {
          if (field.password) field.defaultValue = _enCryptPass(field.defaultValue);
          const setting = new AdminSetting({
            settingId: field.id,
            value: field.defaultValue,
            defaultValue: field.defaultValue,
            settingReadRight: field.settingReadRight || 0,
            type: field.settingType,
          });
          if (field.password) setting.password = true;
          await setting.save();
          settingsSaved++;
        }
      }
    }
    if (settingsSaved)
      logger.log(`Saved ${settingsSaved} admin setting${settingsSaved === 1 ? '' : 's'}.`);
  }

  // Create emails
  const emailKeys = Object.keys(emailData);
  for (let i = 0; i < emailKeys.length; i++) {
    const email = emailData[emailKeys[i]];
    const id = email.emailId;
    const savedEmail = await Email.findOne({ emailId: id });
    if (!savedEmail) {
      email.created = {};
      email.created.by = null;
      email.created.date = new Date();
      const newEmail = new Email(email);
      await newEmail.save();
      logger.log(`Preset email template '${email.emailId}' created.`);
    }
  }
};

const _enCryptPass = (value) => {
  if (value === '') return value;
  const ciphertext = CryptoJS.AES.encrypt(value, process.env.SECRET).toString();
  return ciphertext;
};

export default createPresetForms;
