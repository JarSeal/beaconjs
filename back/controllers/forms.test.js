import axios from 'axios';

import startBackend from '../test/serverSetup';
import { createUserAndLogin, login, resetAllUsers } from '../test/utils';
import config from '../utils/config';

let loginData;
const apiUrl = config.getApiBaseUrl('http://localhost');

describe('forms controller', () => {
  startBackend();

  beforeAll(async () => {
    loginData = await createUserAndLogin();
  });

  it('should get a form by id', async () => {
    loginData = await resetAllUsers(loginData);

    // Get beacon main login form as a public user
    let response = await axios.get(`${apiUrl}/forms/beacon-main-login`);
    expect(response.data.id).toEqual('beacon-main-login');
    // Try to get user settings form as a public user
    try {
      response = await axios.get(`${apiUrl}/forms/user-settings-form`);
    } catch (error) {
      response = error.response;
    }
    expect(response.status).toEqual(401);
    expect(response.data).toEqual({
      _sess: false,
      loggedIn: false,
      msg: 'User not authenticated or session has expired',
    });

    // Try to get unknown form
    try {
      response = await axios.get(`${apiUrl}/forms/somefhjkshfdshjkf`);
    } catch (error) {
      response = error.response;
    }
    expect(response.status).toEqual(404);
    expect(response.data).toEqual({
      id: 'somefhjkshfdshjkf',
      msg: 'Could not find form.',
    });

    loginData = await login({
      username: 'testUser1',
      password: 'testuser',
    });

    // Get user settings as a logged in, level 2 user
    response = await axios.get(`${apiUrl}/forms/user-settings-form`, loginData.session.credentials);
    expect(response.data.id).toEqual('user-settings-form');
    // Try to get an admin level form with level 2 user
    try {
      response = await axios.get(`${apiUrl}/forms/admin-settings-form`);
    } catch (error) {
      response = error.response;
    }
    expect(response.status).toEqual(401);
    expect(response.data).toEqual({
      _sess: false,
      loggedIn: false,
      msg: 'User not authenticated or session has expired',
    });
  });
});
