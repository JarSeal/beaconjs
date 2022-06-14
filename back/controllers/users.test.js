import axios from 'axios';

import User from '../models/user';
import AdminSetting from '../models/adminSetting';
import { startBackendBefore, startBackendAfter } from '../test/serverSetup';
import { createUserAndLogin, createUser, doLogout, getCSRF, login } from '../test/utils';
import config from '../utils/config';

let loginData;
const apiUrl = config.getApiBaseUrl('http://localhost');

beforeAll(async () => {
  await startBackendBefore();
  loginData = await createUserAndLogin();
});

afterAll(async () => {
  await startBackendAfter();
});

describe('users 1', () => {
  // GET ALL USERS
  it('should get all users (only admins)', async () => {
    let response;
    loginData = await doLogout(loginData?.session?.credentials);

    // Not logged in user
    try {
      response = await axios.get(`${apiUrl}/users`, loginData.session.credentials);
    } catch (err) {
      response = err.response;
    }
    expect(response.status).toEqual(401);
    expect(response.data).toEqual({
      _sess: false,
      loggedIn: false,
      msg: 'User not authenticated or session has expired',
    });

    // regular level 2 user
    loginData = await login({
      username: 'testUser1',
      password: 'testuser',
    });
    try {
      response = await axios.get(`${apiUrl}/users`, loginData.session.credentials);
    } catch (err) {
      response = err.response;
    }
    expect(response.status).toEqual(401);
    expect(response.data).toEqual({
      unauthorised: true,
      msg: 'Unauthorised',
    });

    loginData = await doLogout(loginData?.session?.credentials);

    // super admin
    loginData = await createUserAndLogin('superAdmin');
    response = await axios.get(`${apiUrl}/users`, loginData.session.credentials);
    expect(response.status).toEqual(200);
    expect(response.data.length > 0).toEqual(true);
  });

  // GET ONE USER
  it('should get one user', async () => {
    let response;
    loginData = await doLogout(loginData?.session?.credentials);

    // Get user "testUser1"
    response = await axios.get(`${apiUrl}/users/testUser1`, loginData.session.credentials);
    expect(response.data.username).toEqual('testUser1');

    // Try to get a non-existing user
    try {
      response = await axios.get(
        `${apiUrl}/users/somenonexistinguser`,
        loginData.session.credentials
      );
    } catch (err) {
      response = err.response;
    }
    expect(response.status).toEqual(404);
    expect(response.data).toEqual({ msg: 'User was not found', userNotFoundError: true });
  });

  // EDIT A USER
  it('should edit a user', async () => {
    let response, CSRF;
    const user1Id = (await User.findOne({ username: 'testUser1' })).id;
    loginData = await doLogout(loginData?.session?.credentials);

    // Try to edit as an logged out user
    try {
      CSRF = await getCSRF(loginData.session);
      response = await axios.put(
        `${apiUrl}/users`,
        {
          id: 'edit-user-form',
          userId: user1Id,
          email: 'some.email@emaillandia.com',
          name: 'John Doe',
          userLevel: 8,
          _csrf: CSRF,
        },
        loginData.session.credentials
      );
    } catch (err) {
      response = err.response;
    }

    expect(response.status).toEqual(401);
    expect(response.data).toEqual({
      msg: 'User not authenticated or session has expired',
      _sess: false,
      loggedIn: false,
    });

    // regular level 2 user
    loginData = await createUserAndLogin({
      username: 'testUser2',
      password: 'testuser',
      email: 'sometestuser2@sometestuserdomain.com',
      name: '',
      userLevel: 2,
    });
    try {
      CSRF = await getCSRF(loginData.session);
      response = await axios.put(
        `${apiUrl}/users`,
        {
          id: 'edit-user-form',
          userId: user1Id,
          email: 'some.email@emaillandia.com',
          name: 'John Doe',
          userLevel: 2,
          _csrf: CSRF,
        },
        loginData.session.credentials
      );
    } catch (err) {
      response = err.response;
    }
    expect(response.status).toEqual(401);
    expect(response.data).toEqual({
      msg: 'Unauthorised',
      unauthorised: true,
    });

    loginData = await doLogout(loginData?.session?.credentials);

    // superAdmin edits a user
    loginData = await createUserAndLogin('superAdmin');
    CSRF = await getCSRF(loginData.session);
    response = await axios.put(
      `${apiUrl}/users`,
      {
        id: 'edit-user-form',
        userId: user1Id,
        email: 'some.email@emaillandia.com',
        name: 'John Doe',
        userLevel: 2,
        _csrf: CSRF,
      },
      loginData.session.credentials
    );
    expect(response.data.name).toEqual('John Doe');

    // Try to set userLevel as 0
    try {
      CSRF = await getCSRF(loginData.session);
      response = await axios.put(
        `${apiUrl}/users`,
        {
          id: 'edit-user-form',
          userId: user1Id,
          email: 'some.email@emaillandia.com',
          name: 'John Doe',
          userLevel: 0,
          _csrf: CSRF,
        },
        loginData.session.credentials
      );
    } catch (err) {
      response = err.response;
    }
    expect(response.status).toEqual(400);
    expect(response.data).toEqual({
      errors: { userLevel: 'Value is out of validation range.' },
      msg: 'Bad request. Validation errors.',
    });

    await AdminSetting.findOneAndUpdate({ settingId: 'email-sending' }, { value: 'true' });
    await AdminSetting.findOneAndUpdate({ settingId: 'use-email-verification' }, { value: 'true' });

    // Try to set an email that is already taken
    try {
      CSRF = await getCSRF(loginData.session);
      response = await axios.put(
        `${apiUrl}/users`,
        {
          id: 'edit-user-form',
          userId: user1Id,
          email: 'sometestuser2@sometestuserdomain.com',
          name: 'John Doe',
          userLevel: 2,
          _csrf: CSRF,
        },
        loginData.session.credentials
      );
    } catch (err) {
      response = err.response;
    }
    expect(response.data).toEqual({
      errors: { email: 'email_taken' },
      emailTaken: true,
      msg: 'Bad request. Validation errors.',
    });

    // Change email
    const user2Id = (await User.findOne({ username: 'testUser2' })).id;
    CSRF = await getCSRF(loginData.session);
    response = await axios.put(
      `${apiUrl}/users`,
      {
        id: 'edit-user-form',
        userId: user2Id,
        email: 'some.emailchanged@emaillandia.com',
        name: '',
        userLevel: 2,
        _csrf: CSRF,
      },
      loginData.session.credentials
    );
    expect(response.data.email).toEqual('some.emailchanged@emaillandia.com');
    expect(response.data.security.verifyEmail.token).toHaveLength(64);
    expect(response.data.security.verifyEmail.oldEmail).toEqual(
      'sometestuser2@sometestuserdomain.com'
    );
    expect(response.data.security.verifyEmail.verified).toEqual(false);

    // Try to set an email that is already taken (but in security.verifyEmail.oldEmail)
    try {
      CSRF = await getCSRF(loginData.session);
      response = await axios.put(
        `${apiUrl}/users`,
        {
          id: 'edit-user-form',
          userId: user1Id,
          email: 'sometestuser2@sometestuserdomain.com',
          name: '',
          userLevel: 2,
          _csrf: CSRF,
        },
        loginData.session.credentials
      );
    } catch (err) {
      response = err.response;
    }
    expect(response.data).toEqual({
      errors: { email: 'email_taken' },
      emailTaken: true,
      msg: 'Bad request. Validation errors.',
    });

    // Try to edit own account (not via edit own profile)
    const user3Id = (await User.findOne({ username: 'superAdmin' })).id;
    CSRF = await getCSRF(loginData.session);
    try {
      response = await axios.put(
        `${apiUrl}/users`,
        {
          id: 'edit-user-form',
          userId: user3Id,
          email: 'sometestuseradmin@sometestuserdomain.com',
          name: '',
          userLevel: 8,
          _csrf: CSRF,
        },
        loginData.session.credentials
      );
    } catch (err) {
      response = err.response;
    }
    expect(response.status).toEqual(401);
    expect(response.data).toEqual({
      msg: 'User not authorised',
      unauthorised: true,
    });
  });
});

describe('users 2', () => {
  // DELETE USERS
  it('should delete one and/or many users', async () => {
    let response, CSRF;
    loginData = await doLogout(loginData?.session?.credentials);

    const user1 = await createUser({
      username: 'deleteUser1',
      password: 'testuser',
      email: 'deleteuser1@sometestuserdomain.com',
      name: '',
      userLevel: 2,
    });
    const user2 = await createUser({
      username: 'deleteUser2',
      password: 'testuser',
      email: 'deleteuser2@sometestuserdomain.com',
      name: '',
      userLevel: 2,
    });
    const user3 = await createUser({
      username: 'deleteUser3',
      password: 'testuser',
      email: 'deleteuser3@sometestuserdomain.com',
      name: '',
      userLevel: 2,
    });
    await createUser({
      username: 'adminUser1',
      password: 'testuser',
      email: 'adminuser1@sometestuserdomain.com',
      name: '',
      userLevel: 8,
    });

    loginData = await createUserAndLogin('superAdmin');

    // Delete one user
    CSRF = await getCSRF(loginData.session);
    response = await axios.post(
      `${apiUrl}/users/delete`,
      {
        id: 'delete-users',
        users: [user1.id],
        _csrf: CSRF,
      },
      loginData.session.credentials
    );
    expect(response.data).toEqual({
      deletionResponse: true,
      allDeleted: true,
      deleted: ['deleteUser1'],
    });

    // Delete many users
    CSRF = await getCSRF(loginData.session);
    response = await axios.post(
      `${apiUrl}/users/delete`,
      {
        id: 'delete-users',
        users: [user2.id, user3.id],
        _csrf: CSRF,
      },
      loginData.session.credentials
    );
    expect(response.data).toEqual({
      deletionResponse: true,
      allDeleted: true,
      deleted: ['deleteUser2', 'deleteUser3'],
    });

    const superAdminId = loginData.user.id;
    loginData = await doLogout(loginData?.session?.credentials);
    loginData = await login({
      username: 'adminUser1',
      password: 'testuser',
    });

    // Try to delete a user with higher userLevel than the deleter
    try {
      CSRF = await getCSRF(loginData.session);
      response = await axios.post(
        `${apiUrl}/users/delete`,
        {
          id: 'delete-users',
          users: [superAdminId],
          _csrf: CSRF,
        },
        loginData.session.credentials
      );
    } catch (err) {
      response = err.response;
    }
    expect(response.status).toEqual(401);
    expect(response.data).toEqual({ unauthorised: true, msg: 'Unauthorised' });
  });
});

describe('users 3', () => {
  // REGISTER USER
  it('should register a new user', async () => {
    let response, CSRF;
    loginData = await doLogout(loginData?.session?.credentials);

    // Try to register a new user as a public user when its not allowed
    await AdminSetting.findOneAndUpdate(
      { settingId: 'public-user-registration' },
      { value: 'false' }
    );
    try {
      CSRF = await getCSRF(loginData.session);
      response = await axios.post(
        `${apiUrl}/users`,
        {
          id: 'new-user-form',
          username: 'trynewuser',
          password: 'testuser',
          name: '',
          email: 'trynewuser@sometestdomain.com',
          _csrf: CSRF,
        },
        loginData.session.credentials
      );
    } catch (err) {
      response = err.response;
    }
    expect(response.status).toEqual(401);
    expect(response.data).toEqual({ unauthorised: true, msg: 'Unauthorised' });

    // Register a new user as a public user
    await AdminSetting.findOneAndUpdate(
      { settingId: 'public-user-registration' },
      { value: 'true' }
    );
    CSRF = await getCSRF(loginData.session);
    response = await axios.post(
      `${apiUrl}/users`,
      {
        id: 'new-user-form',
        username: 'newUser1',
        password: 'testuser',
        name: '',
        email: 'newuser1@sometestdomain.com',
        _csrf: CSRF,
      },
      loginData.session.credentials
    );
    expect(response.data.username).toEqual('newUser1');
    expect(response.data.email).toEqual('newuser1@sometestdomain.com');
    expect(response.data.userLevel).toEqual(2);
  });
});
