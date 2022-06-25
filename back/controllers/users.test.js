import axios from 'axios';

import User from '../models/user';
import AdminSetting from '../models/adminSetting';
import startBackend from '../test/serverSetup';
import {
  createUserAndLogin,
  createUser,
  doLogout,
  getCSRF,
  login,
  resetAllUsers,
} from '../test/utils';
import config from '../utils/config';

let loginData;
const apiUrl = config.getApiBaseUrl('http://localhost');

describe('users tests 1', () => {
  startBackend();

  beforeAll(async () => {
    loginData = await createUserAndLogin();
  });

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

describe('users tests 2', () => {
  startBackend();

  beforeAll(async () => {
    loginData = await createUserAndLogin();
  });

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

    // Try to register a new user with a username that is already taken
    try {
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
    } catch (err) {
      response = err.response;
    }
    expect(response.data).toEqual({
      msg: 'Bad request. Validation errors.',
      errors: { username: 'username_taken' },
      usernameTaken: true,
    });

    // Try to register a new user with a email that is already taken
    try {
      CSRF = await getCSRF(loginData.session);
      response = await axios.post(
        `${apiUrl}/users`,
        {
          id: 'new-user-form',
          username: 'newUser2',
          password: 'testuser',
          name: '',
          email: 'newuser1@sometestdomain.com',
          _csrf: CSRF,
        },
        loginData.session.credentials
      );
    } catch (err) {
      response = err.response;
    }
    expect(response.data).toEqual({
      msg: 'Bad request. Validation errors.',
      errors: { email: 'email_taken' },
      emailTaken: true,
    });
  });

  // EDIT OWN PROFILE
  it('should edit own profile', async () => {
    let response, CSRF;
    loginData = await doLogout(loginData?.session?.credentials);
    loginData = await createUserAndLogin('superAdmin');
    loginData = await doLogout(loginData.session.credentials);
    loginData = await createUserAndLogin();

    // Try to edit your own profile with a wrong password
    try {
      CSRF = await getCSRF(loginData.session);
      response = await axios.put(
        `${apiUrl}/users/own/profile`,
        {
          id: 'edit-profile-form',
          curPassword: 'wrongpass',
          name: 'Slim Shady',
          email: 'newuser1@sometestdomain.com',
          _csrf: CSRF,
        },
        loginData.session.credentials
      );
    } catch (err) {
      response = err.response;
    }
    expect(response.status).toEqual(401);
    expect(response.data).toEqual({
      error: 'invalid password',
      loggedIn: true,
      noRedirect: true,
      errors: { curPassword: 'wrong_password' },
    });

    // Try to edit your own profile with a taken email
    try {
      CSRF = await getCSRF(loginData.session);
      response = await axios.put(
        `${apiUrl}/users/own/profile`,
        {
          id: 'edit-profile-form',
          curPassword: 'testuser',
          name: '',
          email: 'sometestuseradmin@sometestuserdomain.com',
          _csrf: CSRF,
        },
        loginData.session.credentials
      );
    } catch (err) {
      response = err.response;
    }
    expect(response.data).toEqual({
      msg: 'Bad request. Validation errors.',
      errors: { email: 'email_taken' },
      emailTaken: true,
    });

    // Successfully edit profile (name and email)
    CSRF = await getCSRF(loginData.session);
    response = await axios.put(
      `${apiUrl}/users/own/profile`,
      {
        id: 'edit-profile-form',
        curPassword: 'testuser',
        name: 'Jack Doe',
        email: 'someothertestuseremail@sometestuserdomain.com',
        _csrf: CSRF,
      },
      loginData.session.credentials
    );
    expect(response.data.username).toEqual('testUser1');
    expect(response.data.email).toEqual('someothertestuseremail@sometestuserdomain.com');
    expect(response.data.name).toEqual('Jack Doe');
    expect(response.data.userLevel).toEqual(2);

    loginData = await resetAllUsers(loginData);
  });

  // EDIT EXPOSURE VALUES
  it('should change users exposure values', async () => {
    let response, CSRF;
    loginData = await doLogout(loginData?.session?.credentials);
    loginData = await createUserAndLogin();

    // User tries to edit own exposure levels when the setting is disabled
    await AdminSetting.findOneAndUpdate(
      { settingId: 'users-can-set-exposure-levels' },
      { value: 'false' }
    );
    try {
      CSRF = await getCSRF(loginData.session);
      response = await axios.put(
        `${apiUrl}/users/user/exposure`,
        {
          id: 'edit-expose-profile-form',
          username: 0,
          name: 0,
          email: 2,
          created_date: 2,
          _csrf: CSRF,
        },
        loginData.session.credentials
      );
    } catch (err) {
      response = err.response;
    }
    expect(response.status).toEqual(401);
    expect(response.data).toEqual({
      msg: 'Unauthorised. Users cannot set exposure levels.',
      unauthorised: true,
    });

    // User tries to edit a disabled exposure field (username)
    await AdminSetting.findOneAndUpdate(
      { settingId: 'users-can-set-exposure-levels' },
      { value: 'true' }
    );
    try {
      CSRF = await getCSRF(loginData.session);
      response = await axios.put(
        `${apiUrl}/users/user/exposure`,
        {
          id: 'edit-expose-profile-form',
          username: 1,
          name: 2,
          email: 2,
          created_date: 2,
          curPassword: 'testuser',
          _csrf: CSRF,
        },
        loginData.session.credentials
      );
    } catch (err) {
      response = err.response;
    }
    expect(response.data.exposure).toEqual({ name: 2, created_date: 2 });

    // Update exposure field successfully (name and created_date)
    CSRF = await getCSRF(loginData.session);
    response = await axios.put(
      `${apiUrl}/users/user/exposure`,
      {
        id: 'edit-expose-profile-form',
        username: 0,
        name: 1,
        email: 2,
        created_date: 1,
        curPassword: 'testuser',
        _csrf: CSRF,
      },
      loginData.session.credentials
    );
    expect(response.data.exposure).toEqual({ name: 1, created_date: 1 });
  });

  // DELETE OWN PROFILE
  it("should delete a user's own profile", async () => {
    let response, CSRF;
    loginData = await doLogout(loginData?.session?.credentials);

    // Try to delete own profile as a superAdmin
    loginData = await createUserAndLogin('superAdmin');
    try {
      CSRF = await getCSRF(loginData.session);
      response = await axios.post(
        `${apiUrl}/users/own/delete`,
        {
          id: 'delete-profile-form',
          password: 'testuser',
          _csrf: CSRF,
        },
        loginData.session.credentials
      );
    } catch (err) {
      response = err.response;
    }
    expect(response.status).toEqual(403);
    expect(response.data).toEqual({ error: 'unauthorised', loggedIn: true });

    loginData = await doLogout(loginData?.session?.credentials);
    loginData = await createUserAndLogin({
      username: 'testUser2',
      password: 'testuser',
      email: 'sometestuser2@sometestuserdomain.com',
      name: '',
      userLevel: 2,
    });

    // Try to delete own profile with wrong password
    try {
      CSRF = await getCSRF(loginData.session);
      response = await axios.post(
        `${apiUrl}/users/own/delete`,
        {
          id: 'delete-profile-form',
          password: 'testfusser',
          _csrf: CSRF,
        },
        loginData.session.credentials
      );
    } catch (err) {
      response = err.response;
    }
    expect(response.status).toEqual(401);
    expect(response.data).toEqual({
      error: 'invalid password',
      loggedIn: true,
    });

    // Successfully delete profile
    CSRF = await getCSRF(loginData.session);
    response = await axios.post(
      `${apiUrl}/users/own/delete`,
      {
        id: 'delete-profile-form',
        password: 'testuser',
        _csrf: CSRF,
      },
      loginData.session.credentials
    );
    expect(response.data).toEqual({ userDeleted: true });
  });

  // CHANGE PASSWORD
  it("should update the user's password", async () => {
    let response, CSRF;
    loginData = await doLogout(loginData?.session?.credentials);

    loginData = await doLogout(loginData?.session?.credentials);
    loginData = await createUserAndLogin({
      username: 'testUser3',
      password: 'firstpassword',
      email: 'sometestuser3@sometestuserdomain.com',
      name: '',
      userLevel: 2,
    });

    // Try to change password with wrong (current) password
    try {
      CSRF = await getCSRF(loginData.session);
      response = await axios.post(
        `${apiUrl}/users/own/changepass`,
        {
          id: 'change-password-form',
          curPassword: 'firstpass',
          password: 'testuser',
          _csrf: CSRF,
        },
        loginData.session.credentials
      );
    } catch (err) {
      response = err.response;
    }
    expect(response.status).toEqual(401);
    expect(response.data).toEqual({
      error: 'invalid password',
      errors: { curPassword: 'wrong_password' },
      loggedIn: true,
      noRedirect: true,
    });

    // Change password succesfully
    CSRF = await getCSRF(loginData.session);
    response = await axios.post(
      `${apiUrl}/users/own/changepass`,
      {
        id: 'change-password-form',
        curPassword: 'firstpassword',
        password: 'testuser',
        _csrf: CSRF,
      },
      loginData.session.credentials
    );
    expect(response.data.username).toEqual('testUser3');
    loginData = await doLogout(loginData?.session?.credentials);
    loginData = await login({ username: 'testUser3', password: 'testuser' }, loginData.session);
    expect(loginData?.user?.username).toEqual('testUser3');
    expect(loginData?.user?.loggedIn).toEqual(true);
  });
});

describe('users tests 3', () => {
  startBackend();

  beforeAll(async () => {
    loginData = await createUserAndLogin();
  });

  // REQUEST A NEW PASSWORD LINK
  it('should be able to request a new password link', async () => {
    let response, CSRF;
    loginData = await doLogout(loginData?.session?.credentials);

    await AdminSetting.findOneAndUpdate({ settingId: 'email-sending' }, { value: 'true' });
    await AdminSetting.findOneAndUpdate({ settingId: 'use-email-verification' }, { value: 'true' });

    CSRF = await getCSRF(loginData.session);
    response = await axios.post(
      `${apiUrl}/users/newpassrequest`,
      {
        id: 'new-pass-request-form',
        email: 'someNonExistingEmail@someNonExistingDomain.org',
        _csrf: CSRF,
      },
      loginData.session.credentials
    );
    expect(response.data).toEqual({ tryingToSend: true });
    CSRF = await getCSRF(loginData.session);
    response = await axios.post(
      `${apiUrl}/users/newpassrequest`,
      {
        id: 'new-pass-request-form',
        email: 'sometestuser@sometestuserdomain.com',
        _csrf: CSRF,
      },
      loginData.session.credentials
    );
    expect(response.data).toEqual({ tryingToSend: true });
  });

  // SAVE NEW PASSWORD WITH TOKEN
  it('should save a new password with a token', async () => {
    let response, CSRF;
    loginData = await doLogout(loginData?.session?.credentials);

    await AdminSetting.findOneAndUpdate({ settingId: 'email-sending' }, { value: 'true' });
    await AdminSetting.findOneAndUpdate({ settingId: 'use-email-verification' }, { value: 'true' });

    // Create new password token
    CSRF = await getCSRF(loginData.session);
    response = await axios.post(
      `${apiUrl}/users/newpassrequest`,
      {
        id: 'new-pass-request-form',
        email: 'sometestuser@sometestuserdomain.com',
        _csrf: CSRF,
      },
      loginData.session.credentials
    );

    // Try to reset password with invalid token
    try {
      CSRF = await getCSRF(loginData.session);
      response = await axios.post(
        `${apiUrl}/users/newpass`,
        {
          id: 'reset-password-w-token-form',
          password: 'newpassword',
          token: 'invalidtokenvalue',
          _csrf: CSRF,
        },
        loginData.session.credentials
      );
    } catch (err) {
      response = err.response;
    }
    expect(response.status).toEqual(401);
    expect(response.data).toEqual({
      msg: 'Token invalid or expired.',
      tokenError: true,
    });

    // Create new password with token
    CSRF = await getCSRF(loginData.session);
    response = await axios.post(
      `${apiUrl}/users/newpass`,
      {
        id: 'reset-password-w-token-form',
        password: 'newpassword',
        token: '123456',
        _csrf: CSRF,
      },
      loginData.session.credentials
    );
    expect(response.data).toEqual({ passwordUpdated: true });
  });

  // VERIFY USER ACCOUNT WITH TOKEN
  it('should send a new e-mail verification link', async () => {
    let response, CSRF;
    loginData = await doLogout(loginData?.session?.credentials);

    await AdminSetting.findOneAndUpdate({ settingId: 'email-sending' }, { value: 'true' });
    await AdminSetting.findOneAndUpdate({ settingId: 'use-email-verification' }, { value: 'true' });

    loginData = await createUserAndLogin({
      username: 'testUserVerifyWToken',
      password: 'testuser',
      email: 'testUserVerifyWToken@sometestuserdomain.com',
      name: '',
      userLevel: 2,
      verified: false,
    });
    CSRF = await getCSRF(loginData.session);
    response = await axios.post(
      `${apiUrl}/users/newemailverification`,
      {
        id: 'new-email-verification',
        _csrf: CSRF,
      },
      loginData.session.credentials
    );

    // Try to verify with an invalid token
    try {
      CSRF = await getCSRF(loginData.session);
      response = await axios.get(
        `${apiUrl}/users/verify/someinvalidtoken`,
        loginData.session.credentials
      );
    } catch (err) {
      response = err.response;
    }
    expect(response.status).toEqual(401);
    expect(response.data).toEqual({ msg: 'Token invalid or expired.', tokenError: true });

    // Verify account with correct token
    CSRF = await getCSRF(loginData.session);
    response = await axios.get(
      `${apiUrl}/users/verify/123456testUserVerifyWToken`,
      loginData.session.credentials
    );
    expect(response.data).toEqual({ verified: true, username: 'testUserVerifyWToken' });
    const user = await User.findOne({ username: 'testUserVerifyWToken' });
    expect(user.security.verifyEmail.verified).toEqual(true);
  });

  // SEND A NEW E-MAIL VERIFICATION LINK
  it('should send a new e-mail verification link', async () => {
    let response, CSRF;
    loginData = await doLogout(loginData?.session?.credentials);

    await AdminSetting.findOneAndUpdate({ settingId: 'email-sending' }, { value: 'true' });
    await AdminSetting.findOneAndUpdate({ settingId: 'use-email-verification' }, { value: 'true' });

    // Try to send a new E-mail verification link, without being logged in
    try {
      CSRF = await getCSRF(loginData.session);
      response = await axios.post(
        `${apiUrl}/users/newemailverification`,
        {
          id: 'new-email-verification',
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

    // Try to send new E-mail verification link when user already verified
    loginData = await createUserAndLogin({
      username: 'testUserSendVLink',
      password: 'testuser',
      email: 'sometestuserSendVLink@sometestuserdomain.com',
      name: '',
      userLevel: 2,
      verified: true,
    });
    try {
      CSRF = await getCSRF(loginData.session);
      response = await axios.post(
        `${apiUrl}/users/newemailverification`,
        {
          id: 'new-email-verification',
          _csrf: CSRF,
        },
        loginData.session.credentials
      );
    } catch (err) {
      response = err.response;
    }
    expect(response.status).toEqual(401);
    expect(response.data).toEqual({ msg: 'Unauthorised', unauthorised: true });

    // Send a new E-mail verification link
    loginData = await doLogout(loginData?.session?.credentials);
    loginData = await createUserAndLogin({
      username: 'testUserSendVLink2',
      password: 'testuser',
      email: 'sometestuserSendVLink2@sometestuserdomain.com',
      name: '',
      userLevel: 2,
      verified: false,
    });
    CSRF = await getCSRF(loginData.session);
    response = await axios.post(
      `${apiUrl}/users/newemailverification`,
      {
        id: 'new-email-verification',
        _csrf: CSRF,
      },
      loginData.session.credentials
    );
    expect(response.data).toEqual({ newVerificationSent: true });
  });
});
