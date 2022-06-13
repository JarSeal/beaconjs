import axios from 'axios';

import User from '../models/user';
import startBackend from '../test/serverSetup';
import { createUserAndLogin, doLogout, getCSRF, login } from '../test/utils';
import config from '../utils/config';

let loginData;
const apiUrl = config.getApiBaseUrl('http://localhost');

describe('users', () => {
  startBackend();

  beforeAll(async () => {
    loginData = await createUserAndLogin();
  });

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
    expect(response.data).toEqual({ msg: 'User was not found.', userNotFoundError: true });
  });

  it('should edit a user', async () => {
    let response, userId;
    loginData = await doLogout(loginData?.session?.credentials);

    // Try to edit as an logged out user
    try {
      userId = (await User.findOne({ username: 'testUser1' })).id;
      const CSRF = await getCSRF(loginData.session);
      response = await axios.put(
        `${apiUrl}/users`,
        {
          id: 'edit-user-form',
          userId,
          email: 'some.email@emaillandia.com',
          name: 'some new name',
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
  });
});
