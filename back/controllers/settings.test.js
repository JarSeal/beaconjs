import mongoose from 'mongoose';
import axios from 'axios';

import startBackend from '../test/serverSetup';
import { createUserAndLogin, setUserSetting, getCSRF } from '../test/utils';
import AdminSetting from '../models/adminSetting';

startBackend();
let loginData;

describe('settings controller', () => {
  beforeAll(async () => {
    loginData = await createUserAndLogin();
  });

  it('should get all user settings', async () => {
    await AdminSetting.findOneAndUpdate(
      { settingId: 'use-two-factor-authentication' },
      { value: 'disabled' }
    );
    let settings = await axios.get(
      'http://localhost:3001/api/settings',
      loginData.session.credentials
    );
    const tableSortingSetting = settings.data.filter(
      (s) => s.settingId === 'table-sorting-setting'
    );
    let twoFactorSetting = settings.data.filter((s) => s.settingId === 'enable-user-2fa-setting');
    expect(tableSortingSetting.length).toEqual(1);
    expect(twoFactorSetting.length).toEqual(0);
    await AdminSetting.findOneAndUpdate(
      { settingId: 'use-two-factor-authentication' },
      { value: 'users_can_choose' }
    );
    settings = await axios.get('http://localhost:3001/api/settings', loginData.session.credentials);
    twoFactorSetting = settings.data.filter((s) => s.settingId === 'enable-user-2fa-setting');
    expect(twoFactorSetting.length).toEqual(1);
  });

  it('should edit a single user setting', async () => {
    await AdminSetting.findOneAndUpdate(
      { settingId: 'use-two-factor-authentication' },
      { value: 'users_can_choose' }
    );
    setUserSetting('table-sorting-setting', loginData.user._id, 'none');
    let settings = await axios.get(
      'http://localhost:3001/api/settings',
      loginData.session.credentials
    );
    let tableSortingSetting = settings.data.filter(
      (s) => s.settingId === 'table-sorting-setting'
    )[0];
    expect(tableSortingSetting.value).toEqual('none');

    let CSRF = await getCSRF(loginData.session);
    await axios.put(
      'http://localhost:3001/api/settings',
      {
        id: 'user-settings-form',
        mongoId: tableSortingSetting.id,
        'table-sorting-setting': 'session',
        _csrf: CSRF,
      },
      loginData.session.credentials
    );
    settings = await axios.get('http://localhost:3001/api/settings', loginData.session.credentials);
    tableSortingSetting = settings.data.filter((s) => s.settingId === 'table-sorting-setting')[0];
    expect(tableSortingSetting.value).toEqual('session');

    const fail = async (payload) => {
      try {
        CSRF = await getCSRF(loginData.session);
        await axios.put(
          'http://localhost:3001/api/settings',
          { ...payload, _csrf: CSRF },
          loginData.session.credentials
        );
      } catch (error) {
        return error.response;
      }
    };

    // Wrong setting mongoId format (400)
    let error = await fail({
      id: 'user-settings-form',
      mongoId: 'wrongIdFormat',
    });
    expect(error.status).toEqual(400);
    expect(error.data).toEqual({
      msg: 'MongoId not valid ID',
      mongoIdNotValid: true,
    });

    // Setting is not found (404)
    error = await fail({
      id: 'user-settings-form',
      mongoId: mongoose.Types.ObjectId(),
    });
    expect(error.status).toEqual(404);
    expect(error.data).toEqual({
      msg: 'Setting was not found',
      settingNotFoundError: true,
    });

    // Trying to edit a user setting that has been disabled in admin settings (401)
    const twoFASetting = settings.data.filter((s) => s.settingId === 'enable-user-2fa-setting')[0];
    await AdminSetting.findOneAndUpdate(
      { settingId: 'use-two-factor-authentication' },
      { value: 'disabled' }
    );
    error = await fail({
      id: 'user-settings-form',
      mongoId: twoFASetting.id,
      'enable-user-2fa-setting': false,
    });
    expect(error.status).toEqual(401);
    expect(error.data).toEqual({
      msg: 'Unauthorised',
      unauthorised: true,
    });
  });
});
