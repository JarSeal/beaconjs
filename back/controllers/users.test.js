import axios from 'axios';

import startBackend from '../test/serverSetup';
import { createUserAndLogin, doLogout, login } from '../test/utils';
import config from '../utils/config';

let loginData;
const apiUrl = config.getApiBaseUrl('http://localhost');

describe('users', () => {
  startBackend();

  beforeAll(async () => {
    loginData = await createUserAndLogin();
  });

  it('Get all users (for admins)', async () => {
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

    loginData = await login({
      username: 'testUser1',
      password: 'testuser',
    });

    // regular level 2 user
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
  });
});
