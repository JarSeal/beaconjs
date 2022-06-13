import axios from 'axios';

import startBackend from '../test/serverSetup';
import {
  createUserAndLogin,
  createUser,
  doLogout,
  login,
  getCSRF,
  checklogin,
} from '../test/utils';
import config from '../utils/config';
import AdminSetting from '../models/adminSetting';
import Form from '../models/form';

let loginData;
const apiUrl = config.getApiBaseUrl('http://localhost');

const tryLogin = async ({ username, password, remember }) => {
  let resp;
  let CSRF = await getCSRF(loginData.session);
  try {
    resp = await axios.post(
      `${apiUrl}/login`,
      {
        id: 'beacon-main-login',
        browserId: loginData.session.browserId,
        username,
        password,
        _csrf: CSRF,
        ['remember-me']: remember || false,
      },
      loginData.session.credentials
    );
    loginData.session = {
      loggedIn: resp.data.loggedIn,
      browserId: loginData.session.browserId,
      credentials: {
        headers: {
          cookie: resp.headers['set-cookie'],
        },
      },
    };
    loginData.username = resp.data.username;
  } catch (err) {
    resp = err.response;
  }
  return resp;
};

// describe('login controller, access', () => {
//   startBackend();

//   beforeAll(async () => {
//     loginData = await createUserAndLogin();
//   });

//   it('should get access with from: "admin"', async () => {
//     loginData = await doLogout(loginData?.session?.credentials);

//     // admin as a public user
//     let response = await axios.post(`${apiUrl}/login/access`, {
//       from: 'admin',
//     });
//     expect(response.data.loggedIn).toEqual(false);
//     expect(response.data.editorRights.length).toEqual(0);
//     expect(response.data.useRights.length).toEqual(0);

//     loginData = await login({
//       username: 'testUser1',
//       password: 'testuser',
//     });

//     // admin as a public user
//     response = await axios.post(
//       `${apiUrl}/login/access`,
//       {
//         from: 'admin',
//       },
//       loginData.session.credentials
//     );
//     expect(response.data.loggedIn).toEqual(true);
//     expect(response.data.editorRights.length).toEqual(0);
//     expect(response.data.useRights.length).toEqual(0);

//     loginData = await doLogout(loginData?.session?.credentials);
//     loginData = await createUserAndLogin('superAdmin');

//     // admin as a super admin
//     response = await axios.post(
//       `${apiUrl}/login/access`,
//       {
//         from: 'admin',
//       },
//       loginData.session.credentials
//     );
//     expect(response.data.loggedIn).toEqual(true);
//     expect(response.data.editorRights.includes('admin-settings-form')).toEqual(true);
//     expect(response.data.useRights.includes('admin-settings-form')).toEqual(true);
//   });

//   it('should get access with from: "checklogin"', async () => {
//     loginData = await doLogout(loginData?.session?.credentials);

//     // checklogin as a public user
//     let response = await axios.post(`${apiUrl}/login/access`, {
//       from: 'checklogin',
//     });
//     expect(response.data.loggedIn).toEqual(false);

//     loginData = await login({
//       username: 'testUser1',
//       password: 'testuser',
//     });

//     // checklogin as a level 2 user
//     response = await axios.post(
//       `${apiUrl}/login/access`,
//       {
//         from: 'checklogin',
//       },
//       loginData.session.credentials
//     );
//     expect(response.data.loggedIn).toEqual(true);
//   });

//   it('should get access with from: "getCSRF"', async () => {
//     let response;
//     loginData = await doLogout(loginData?.session?.credentials);

//     // getCSRF as a public user and with and without browserId
//     try {
//       response = await axios.post(`${apiUrl}/login/access`, {
//         from: 'getCSRF',
//       });
//     } catch (error) {
//       response = error.response;
//     }
//     expect(response.data.loggedIn).toEqual(false);
//     expect(response.status).toEqual(409);
//     expect(response.data).toEqual({
//       conflictError: true,
//       errorMsg: 'browserId conflict',
//       loggedIn: false,
//     });
//     try {
//       response = await axios.post(`${apiUrl}/login/access`, {
//         from: 'getCSRF',
//         browserId: 'e59b1e5fd129008eecbc4ed3e0c206f9',
//       });
//     } catch (error) {
//       response = error.response;
//     }
//     expect(response.data.loggedIn).toEqual(false);
//     expect(response.status).toEqual(409);
//     expect(response.data).toEqual({
//       conflictError: true,
//       errorMsg: 'browserId conflict',
//       loggedIn: false,
//     });

//     loginData = await login({
//       username: 'testUser1',
//       password: 'testuser',
//     });

//     // getCSRF as a logged in user
//     response = await axios.post(
//       `${apiUrl}/login/access`,
//       {
//         from: 'getCSRF',
//         browserId: loginData.session.browserId,
//       },
//       loginData.session.credentials
//     );
//     expect(response.data.loggedIn).toEqual(true);
//     expect(response.data.csrfToken.length).toEqual(36);
//   });

//   it('should logout the user', async () => {
//     loginData = await doLogout(loginData?.session?.credentials);
//     loginData = await login({
//       username: 'testUser1',
//       password: 'testuser',
//     });
//     expect(loginData.user.loggedIn).toEqual(true);
//     const response = await axios.post(
//       `${apiUrl}/login/access`,
//       {
//         from: 'logout',
//       },
//       loginData.session.credentials
//     );
//     expect(response.data.loggedIn).toEqual(false);
//   });
// });

describe('login controller, login', () => {
  startBackend();

  beforeAll(async () => {
    loginData = await createUserAndLogin();
  });

  // it('should login a user (no 2FA)', async () => {
  //   let response;
  //   loginData = await doLogout(loginData?.session?.credentials);

  //   // Try login with wrong password
  //   response = await tryLogin({ username: 'testUser1', password: 'test' });
  //   expect(response.status).toEqual(401);
  //   expect(response.data.loggedIn).toEqual(false);
  //   expect(response.data.error).toEqual('invalid username and/or password');

  //   // Try login with wrong username
  //   response = await tryLogin({ username: 'fdsjksdfkj', password: 'testuser' });
  //   expect(response.status).toEqual(401);
  //   expect(response.data.loggedIn).toEqual(false);
  //   expect(response.data.error).toEqual('invalid username and/or password');

  //   // Successfully login
  //   await AdminSetting.findOneAndUpdate({ settingId: 'email-sending' }, { value: 'true' });
  //   await AdminSetting.findOneAndUpdate({ settingId: 'use-email-verification' }, { value: 'true' });
  //   response = await tryLogin({ username: 'testUser1', password: 'testuser' });
  //   expect(response.data.loggedIn).toEqual(true);
  //   expect(response.data.accountVerified).toEqual(true);

  //   loginData = await doLogout(loginData?.session?.credentials);
  //   await createUser({
  //     username: 'lockUser1',
  //     password: 'testuser',
  //     userLevel: 2,
  //     email: 'someemail@emaildemo.fi',
  //     verified: true,
  //     name: '',
  //   });

  //   await AdminSetting.findOneAndUpdate({ settingId: 'max-login-attempts' }, { value: '3' });

  //   // Fail login with user "lockUser1" 4 times, Cooldown test
  //   response = await tryLogin({ username: 'lockUser1', password: 'test' });
  //   expect(response.status).toEqual(401);
  //   response = await tryLogin({ username: 'lockUser1', password: 'test' });
  //   expect(response.status).toEqual(401);
  //   response = await tryLogin({ username: 'lockUser1', password: 'test' });
  //   expect(response.status).toEqual(401);
  //   response = await tryLogin({ username: 'lockUser1', password: 'test' });
  //   expect(response.status).toEqual(403);
  //   expect(response.data.error).toEqual('user must wait a cooldown period before trying again');

  //   // Test to login with level 1 user (set the beacon-main-login form to accept only level 2 and above user logins)
  //   loginData = await doLogout(loginData?.session?.credentials);
  //   await createUser({
  //     username: 'level1User',
  //     password: 'testuser',
  //     userLevel: 1,
  //     email: 'someemail2@emaildemo.fi',
  //     verified: true,
  //     name: '',
  //   });
  //   await Form.findOneAndUpdate(
  //     { formId: 'beacon-main-login' },
  //     { 'editorOptions.loginAccessLevel.value': 2 }
  //   );
  //   response = await tryLogin({ username: 'level1User', password: 'testuser' });
  //   expect(response.status).toEqual(401);
  //   expect(response.data.loggedIn).toEqual(false);

  //   // Test unverified login
  //   loginData = await doLogout(loginData?.session?.credentials);
  //   await createUser({
  //     username: 'unverifiedUser1',
  //     password: 'testuser',
  //     userLevel: 2,
  //     email: 'someemail3@emaildemo.fi',
  //     verified: false,
  //     name: '',
  //   });
  //   response = await tryLogin({ username: 'unverifiedUser1', password: 'testuser' });
  //   expect(response.data.loggedIn).toEqual(true);
  //   expect(response.data.accountVerified).toEqual(false);
  // });

  it('should login a user with 2FA', async () => {
    let response;
    loginData = await doLogout(loginData?.session?.credentials);
    await AdminSetting.findOneAndUpdate({ settingId: 'email-sending' }, { value: 'true' });
    await AdminSetting.findOneAndUpdate({ settingId: 'use-email-verification' }, { value: 'true' });
    await AdminSetting.findOneAndUpdate(
      { settingId: 'use-two-factor-authentication' },
      { value: 'enabled_always' }
    );
    await createUser({
      username: 'twoFAUser1',
      password: 'testuser',
      userLevel: 2,
      email: 'someemail4@emaildemo.fi',
      verified: true,
      name: '',
    });
    response = await tryLogin({ username: 'twoFAUser1', password: 'testuser' });
    expect(response.data.proceedToTwoFa).toEqual(true);
    expect(response.data.loggedIn).toEqual(false);

    let CSRF = await getCSRF(loginData?.session);
    console.log('LOGIN DATA FROM TRY LOGIN', CSRF, loginData?.session?.credentials);
    let payload = {
      browserId: loginData.session.browserId,
      id: 'beacon-twofa-login',
      twofacode: '123455',
      username: 'twoFAUser1',
      _csrf: CSRF,
    };
    try {
      payload = {};
      response = await axios.post(`${apiUrl}/login/two`, payload, loginData.session.credentials);
    } catch (err) {
      response = err.response;
    }
    console.log('TADAA', response);
    // - Try first with wrong code
    // - Expect to login successfully with right code (123456)
    // - Logout
    // - Set max-login-attempts adminSetting to 3
    // - Login
    // - Fail the code insert 3 times
    // - Expect cooldown

    await AdminSetting.findOneAndUpdate(
      { settingId: 'use-two-factor-authentication' },
      { value: 'disabled' }
    );
  });

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
