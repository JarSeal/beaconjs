import connectTestMongo from '../test/mongoSetup';
import { getSettings } from './settingsService';
import AdminSetting from '../models/adminSetting';
import Form from '../models/form';
import { checkAccess, checkIfLoggedIn } from './checkAccess';

connectTestMongo();

const request1 = {
  session: {
    _id: '6293f65e9be6aa0e604218e3',
    userLevel: 2,
    username: 'myUsername',
    loggedIn: true,
    verified: false,
  },
};
const request2 = {
  session: {
    _id: '6293f65e9be6aa0e604218e3',
    userLevel: 2,
    username: 'myUsername',
    loggedIn: true,
    verified: true,
  },
};
const request3 = {
  session: {
    _id: '6293f65e9be6aa0e604218e4',
    userLevel: 9,
    username: 'Admin',
    loggedIn: true,
    verified: true,
  },
};
const request4 = {
  session: {
    loggedIn: false,
  },
};

describe('checkAccess', () => {
  it('should check access of a route or a form according to session, form, and settings', async () => {
    await AdminSetting.findOneAndUpdate(
      { settingId: 'public-user-registration' },
      { value: 'true' }
    );
    await AdminSetting.findOneAndUpdate(
      { settingId: 'user-level-required-to-register' },
      { value: '8' }
    );
    await AdminSetting.findOneAndUpdate({ settingId: 'use-email-verification' }, { value: 'true' });
    const settings = await getSettings(null);
    const formBeaconMainLogin = await Form.findOne({ formId: 'beacon-main-login' });
    const formReadProfile = await Form.findOne({ formId: 'read-profile' });
    formReadProfile.useRightsLevel = 1;
    const formDeleteUsers = await Form.findOne({ formId: 'delete-users' });
    formDeleteUsers.useRightsLevel = 8;
    const formUserSettings = await Form.findOne({ formId: 'user-settings-form' });
    formUserSettings.useRightsLevel = 2;

    const check1_1 = checkAccess(request1, formBeaconMainLogin, settings);
    expect(check1_1).toEqual(false);
    const check1_2 = checkAccess(request1, formReadProfile, settings);
    expect(check1_2).toEqual(true);
    const check1_3 = checkAccess(request1, formDeleteUsers, settings);
    expect(check1_3).toEqual(false);

    const check2_1 = checkAccess(request2, formBeaconMainLogin, settings);
    expect(check2_1).toEqual(false);
    const check2_2 = checkAccess(request2, formReadProfile, settings);
    expect(check2_2).toEqual(true);
    const check2_3 = checkAccess(request2, formDeleteUsers, settings);
    expect(check2_3).toEqual(false);

    const check3_1 = checkAccess(request3, formBeaconMainLogin, settings);
    expect(check3_1).toEqual(false);
    const check3_2 = checkAccess(request3, formReadProfile, settings);
    expect(check3_2).toEqual(true);
    const check3_3 = checkAccess(request3, formDeleteUsers, settings);
    expect(check3_3).toEqual(true);

    const check4_1 = checkAccess(request4, formBeaconMainLogin, settings);
    expect(check4_1).toEqual(true);
    const check4_2 = checkAccess(request4, formReadProfile, settings);
    expect(check4_2).toEqual(false);
    const check4_3 = checkAccess(request4, formDeleteUsers, settings);
    expect(check4_3).toEqual(false);

    const check5_1 = checkAccess(request1, formUserSettings, settings);
    expect(check5_1).toEqual(false);
    const check5_2 = checkAccess(request2, formUserSettings, settings);
    expect(check5_2).toEqual(true);
  });

  it('should check if session user is logged in or not', () => {
    expect(checkIfLoggedIn()).toEqual(false);
    expect(checkIfLoggedIn(request1.session)).toEqual(true);
    expect(checkIfLoggedIn(request2.session)).toEqual(true);
    expect(checkIfLoggedIn(request3.session)).toEqual(true);
    expect(checkIfLoggedIn(request4.session)).toEqual(false);
  });
});
