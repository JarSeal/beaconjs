import Form from '../models/form';
import AdminSetting from '../models/adminSetting';
import Email from '../models/email';
import createPresetData from './createPresetData';
import startBackend from '../test/serverSetup';
import formData from '../../shared/formData/formData';
import emailData from '../../shared/emailData/emailData';
import adminSettings from '../../shared/formData/adminSettingsFormData';
import shared from '../shared/index.js';
import { loopFormFields } from '../utils/helpers';

describe('formEngine', () => {
  startBackend();

  // forms
  it('should create all necessary preset forms for Beacon', async () => {
    await Form.deleteMany();
    let forms = await Form.find();
    expect(forms).toHaveLength(0);

    // Get preset form IDs
    const routeAccess = shared.CONFIG.ROUTE_ACCESS;
    const formIDs = [];
    for (let i = 0; i < formData.length; i++) {
      formIDs.push(formData[i].formId);
    }
    for (let i = 0; i < routeAccess.length; i++) {
      formIDs.push(routeAccess[i].formId);
    }

    await createPresetData();

    forms = await Form.find();
    expect(forms.length).toEqual(formIDs.length);

    await Form.findOneAndRemove({ formId: 'beacon-main-login' });
    await createPresetData();

    forms = await Form.find();
    expect(forms.length).toEqual(formIDs.length);
  });

  // admin settings
  it('should create all admin settings for Beacon', async () => {
    await Form.deleteMany();
    let forms = await Form.find();
    expect(forms).toHaveLength(0);
    await AdminSetting.deleteMany();
    let aSettings = await AdminSetting.find();
    expect(aSettings).toHaveLength(0);

    // Get adminSetting ids
    const adminFieldIDs = [];
    loopFormFields({ formData: adminSettings }, (field) => adminFieldIDs.push(field.id));

    await createPresetData();

    aSettings = await AdminSetting.find();
    expect(aSettings.length).toEqual(adminFieldIDs.length);

    await AdminSetting.findOneAndRemove({ emailId: 'max-login-attempts' });
    await createPresetData();

    aSettings = await AdminSetting.find();
    expect(aSettings.length).toEqual(adminFieldIDs.length);
  });

  // emails
  it('should create all preset emails for Beacon', async () => {
    await Form.deleteMany();
    let forms = await Form.find();
    expect(forms).toHaveLength(0);
    await AdminSetting.deleteMany();
    let aSettings = await AdminSetting.find();
    expect(aSettings).toHaveLength(0);
    await Email.deleteMany();
    let emails = await Email.find();
    expect(emails).toHaveLength(0);

    const emailKeys = Object.keys(emailData);
    const emailIds = [];
    for (let i = 0; i < emailKeys.length; i++) {
      emailIds.push(emailData[emailKeys[i]].emailId);
    }

    await createPresetData();

    emails = await Email.find();
    expect(emails.length).toEqual(emailIds.length);

    await Email.findOneAndRemove({ emailId: 'new-user-email' });
    await createPresetData();

    emails = await Email.find();
    expect(emails.length).toEqual(emailIds.length);
  });
});
