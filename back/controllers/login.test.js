import axios from 'axios';

import startBackend from '../test/serverSetup';
import { createUserAndLogin, doLogout, login } from '../test/utils';

let loginData;

describe('login controller', () => {
  startBackend();

  beforeAll(async () => {
    loginData = await createUserAndLogin();
  });

  it('should get access with from: "admin"', async () => {
    loginData = await doLogout(loginData?.session?.credentials);

    // admin as a public user
    let response = await axios.post('http://localhost:3001/api/login/access', {
      from: 'admin',
    });
    expect(response.data.loggedIn).toEqual(false);
    expect(response.data.editorRights.length).toEqual(0);
    expect(response.data.useRights.length).toEqual(0);

    loginData = await login({
      username: 'testUser1',
      password: 'testuser',
    });

    // admin as a public user
    response = await axios.post(
      'http://localhost:3001/api/login/access',
      {
        from: 'admin',
      },
      loginData.session.credentials
    );
    expect(response.data.loggedIn).toEqual(true);
    expect(response.data.editorRights.length).toEqual(0);
    expect(response.data.useRights.length).toEqual(0);

    loginData = await doLogout(loginData?.session?.credentials);
    loginData = await createUserAndLogin('superAdmin');

    // admin as a super admin
    response = await axios.post(
      'http://localhost:3001/api/login/access',
      {
        from: 'admin',
      },
      loginData.session.credentials
    );
    expect(response.data.loggedIn).toEqual(true);
    expect(response.data.editorRights.includes('admin-settings-form')).toEqual(true);
    expect(response.data.useRights.includes('admin-settings-form')).toEqual(true);
  });

  it('should get access with from: "checklogin"', async () => {
    loginData = await doLogout(loginData?.session?.credentials);

    // checklogin as a public user
    let response = await axios.post('http://localhost:3001/api/login/access', {
      from: 'checklogin',
    });
    expect(response.data.loggedIn).toEqual(false);

    loginData = await login({
      username: 'testUser1',
      password: 'testuser',
    });

    // checklogin as a level 2 user
    response = await axios.post(
      'http://localhost:3001/api/login/access',
      {
        from: 'checklogin',
      },
      loginData.session.credentials
    );
    expect(response.data.loggedIn).toEqual(true);
  });

  it('should get access with from: "getCSRF"', async () => {
    let response;
    loginData = await doLogout(loginData?.session?.credentials);

    // getCSRF as a public user and with and without browserId
    try {
      response = await axios.post('http://localhost:3001/api/login/access', {
        from: 'getCSRF',
      });
    } catch (error) {
      response = error.response;
    }
    expect(response.data.loggedIn).toEqual(false);
    expect(response.status).toEqual(409);
    expect(response.data).toEqual({
      conflictError: true,
      errorMsg: 'browserId conflict',
      loggedIn: false,
    });
    try {
      response = await axios.post('http://localhost:3001/api/login/access', {
        from: 'getCSRF',
        browserId: 'e59b1e5fd129008eecbc4ed3e0c206f9',
      });
    } catch (error) {
      response = error.response;
    }
    expect(response.data.loggedIn).toEqual(false);
    expect(response.status).toEqual(409);
    expect(response.data).toEqual({
      conflictError: true,
      errorMsg: 'browserId conflict',
      loggedIn: false,
    });

    loginData = await login({
      username: 'testUser1',
      password: 'testuser',
    });

    // getCSRF as a logged in user
    response = await axios.post(
      'http://localhost:3001/api/login/access',
      {
        from: 'getCSRF',
        browserId: loginData.session.browserId,
      },
      loginData.session.credentials
    );
    expect(response.data.loggedIn).toEqual(true);
    expect(response.data.csrfToken.length).toEqual(36);
  });

  // Logout

  // Check access for formId(s)

  // Actual login

  // 2FA Login

  // Login functions
  // - _getUserSecurity
  // - _userUnderCooldown
  // - _checkGivenPassword
  // - _checkForm
  // - _check2Fa
  // - _clearNewPassLinkAndLoginAttempts
  // - _createSessionAndRespond
  // - _check2FACode
});
