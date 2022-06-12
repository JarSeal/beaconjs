import mongoose from 'mongoose';
import axios from 'axios';

import startBackend from '../test/serverSetup';
import { createUserAndLogin, setUserSetting, getCSRF, doLogout, login } from '../test/utils';
import AdminSetting from '../models/adminSetting';
import config from '../utils/config';

let loginData, _userId;
const apiUrl = config.getApiBaseUrl('http://localhost');

describe('settings controller', () => {
  startBackend();

  beforeAll(async () => {
    loginData = await createUserAndLogin();
    _userId = loginData.user._id;
  });

  it('should get all user settings', async () => {
    loginData = await doLogout(loginData?.session?.credentials);
    loginData = await createUserAndLogin('superAdmin');

    await AdminSetting.findOneAndUpdate(
      { settingId: 'use-two-factor-authentication' },
      { value: 'disabled' }
    );
    let settings = await axios.get(`${apiUrl}/settings`, loginData.session.credentials);
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
    settings = await axios.get(`${apiUrl}/settings`, loginData.session.credentials);
    twoFactorSetting = settings.data.filter((s) => s.settingId === 'enable-user-2fa-setting');
    expect(twoFactorSetting.length).toEqual(1);

    loginData = await doLogout(loginData?.session?.credentials);
    const fail = async () => {
      try {
        settings = await axios.get(`${apiUrl}/settings`, {});
      } catch (error) {
        return error.response;
      }
    };
    let error = await fail();
    expect(error.status).toEqual(401);
    expect(error.data).toEqual({
      _sess: false,
      loggedIn: false,
      msg: 'User not authenticated or session has expired',
    });
  });

  it('should edit a single user setting', async () => {
    await AdminSetting.findOneAndUpdate(
      { settingId: 'use-two-factor-authentication' },
      { value: 'users_can_choose' }
    );
    loginData = await doLogout(loginData?.session?.credentials);
    loginData = await login({
      username: 'testUser1',
      password: 'testuser',
    });
    setUserSetting('table-sorting-setting', _userId, 'none');
    let settings = await axios.get(`${apiUrl}/settings`, loginData.session.credentials);
    let tableSortingSetting = settings.data.filter(
      (s) => s.settingId === 'table-sorting-setting'
    )[0];
    expect(tableSortingSetting.value).toEqual('none');

    let CSRF = await getCSRF(loginData.session);
    await axios.put(
      `${apiUrl}/settings`,
      {
        id: 'user-settings-form',
        mongoId: tableSortingSetting.id,
        'table-sorting-setting': 'session',
        _csrf: CSRF,
      },
      loginData.session.credentials
    );
    settings = await axios.get(`${apiUrl}/settings`, loginData.session.credentials);
    tableSortingSetting = settings.data.filter((s) => s.settingId === 'table-sorting-setting')[0];
    expect(tableSortingSetting.value).toEqual('session');

    const fail = async (payload) => {
      try {
        CSRF = await getCSRF(loginData.session);
        await axios.put(
          `${apiUrl}/settings`,
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

  it('should get all admin settings', async () => {
    loginData = await doLogout(loginData?.session?.credentials);

    // Trying to get admin settings as a not logged in user
    let fail = async () => {
      try {
        await axios.get(`${apiUrl}/settings/admin`, {});
      } catch (error) {
        return error.response;
      }
    };
    let error = await fail();
    expect(error.status).toEqual(401);
    expect(error.data).toEqual({
      _sess: false,
      loggedIn: false,
      msg: 'User not authenticated or session has expired',
    });

    // Default is level 2 user
    loginData = await login({
      username: 'testUser1',
      password: 'testuser',
    });

    // Still fail, because user is only level 2 user
    fail = async () => {
      try {
        await axios.get(`${apiUrl}/settings/admin`, loginData.session.credentials);
      } catch (error) {
        return error.response;
      }
    };
    error = await fail();
    expect(error.status).toEqual(401);
    expect(error.data).toEqual({
      msg: 'Unauthorised',
      unauthorised: true,
    });

    // Super admin gets to see them
    loginData = await doLogout(loginData?.session?.credentials);
    const adminLogin = await createUserAndLogin('superAdmin');
    const adminSettings = await axios.get(
      `${apiUrl}/settings/admin`,
      adminLogin.session.credentials
    );
    expect(adminSettings.data.length > 10).toEqual(true);
  });

  it('should update a specific admin setting', async () => {
    loginData = await doLogout(loginData?.session?.credentials);
    loginData = await login({
      username: 'superAdmin',
      password: 'testuser',
    });
    const adminSettings = (
      await axios.get(`${apiUrl}/settings/admin`, loginData.session.credentials)
    ).data;
    const exposureSetting = adminSettings.filter(
      (s) => s.settingId === 'users-can-set-exposure-levels'
    )[0];
    const oldCredentials = { ...loginData.session.credentials };
    let CSRF = await getCSRF(loginData.session);
    loginData = await doLogout(loginData?.session?.credentials);

    // Logged out user tries to update an admin setting
    let fail = async () => {
      try {
        const response = await axios.put(
          `${apiUrl}/settings/admin`,
          {
            id: 'admin-settings-form',
            'users-can-set-exposure-levels': false,
            mongoId: exposureSetting.id,
            _csrf: CSRF,
          },
          oldCredentials
        );
        return response;
      } catch (error) {
        return error.response;
      }
    };
    let error = await fail();
    expect(error.status).toEqual(403);
    expect(error.data).toEqual({ error: 'CSRF token fail' });

    // Default level 2 user tries to update an admin setting
    loginData = await login({
      username: 'testUser1',
      password: 'testuser',
    });
    CSRF = await getCSRF(loginData.session);
    fail = async () => {
      try {
        const response = await axios.put(
          `${apiUrl}/settings/admin`,
          {
            id: 'admin-settings-form',
            'users-can-set-exposure-levels': false,
            mongoId: exposureSetting.id,
            _csrf: CSRF,
          },
          loginData.session.credentials
        );
        return response;
      } catch (error) {
        return error.response;
      }
    };
    error = await fail();
    expect(error.status).toEqual(401);
    expect(error.data).toEqual({
      msg: 'Unauthorised',
      unauthorised: true,
    });

    // Super admin updates an admin setting
    loginData = await doLogout(loginData?.session?.credentials);
    loginData = await login({
      username: 'superAdmin',
      password: 'testuser',
    });
    CSRF = await getCSRF(loginData.session);
    let trying = async () => {
      try {
        const response = await axios.put(
          `${apiUrl}/settings/admin`,
          {
            id: 'admin-settings-form',
            'users-can-set-exposure-levels': false,
            mongoId: exposureSetting.id,
            _csrf: CSRF,
          },
          loginData.session.credentials
        );
        return response;
      } catch (error) {
        return error.response;
      }
    };
    let success = await trying();
    expect(success.status).toEqual(200);
    expect(success.data.canSetExposure).toEqual(false);
    CSRF = await getCSRF(loginData.session);
    trying = async () => {
      try {
        const response = await axios.put(
          `${apiUrl}/settings/admin`,
          {
            id: 'admin-settings-form',
            'users-can-set-exposure-levels': true,
            mongoId: exposureSetting.id,
            _csrf: CSRF,
          },
          loginData.session.credentials
        );
        return response;
      } catch (error) {
        return error.response;
      }
    };
    success = await trying();
    expect(success.status).toEqual(200);
    expect(success.data.canSetExposure).toEqual(true);
  });
});
