import {
  getAndValidateForm,
  // validateField,
  // validateKeys,
  // validateFormData,
  // validatePrivileges,
  // csrfProtection,
  // csrfNewToken,
  // getUserExposure,
} from './formEngine';
import startBackend from '../../test/serverSetup';
import { requests } from '../../test/dummyData';

describe('formEngine', () => {
  startBackend();

  // getAndValidateForm
  it('should get and validate a form', async () => {
    const notLoggedInRequest = requests.request4;
    let error = await getAndValidateForm('beacon-main-logins', 'GET', notLoggedInRequest);
    expect(error).toEqual({
      code: 404,
      obj: { msg: 'Form not found', formNotFoundError: true, loggedIn: false },
    });
    error = await getAndValidateForm('beacon-main-login', 'GET', notLoggedInRequest);
    expect(error).toEqual(null);
    error = await getAndValidateForm('read-users', 'GET', notLoggedInRequest);
    expect(error).toEqual({
      code: 401,
      obj: {
        msg: 'User not authenticated or session has expired',
        _sess: false,
        loggedIn: false,
      },
    });
    error = await getAndValidateForm('change-password-form', 'POST', notLoggedInRequest);
    expect(error).toEqual({
      code: 401,
      obj: {
        msg: 'User not authenticated or session has expired',
        _sess: false,
        loggedIn: false,
      },
    });
    let loggedInRequest = {
      ...requests.request1,
      body: { password: '1', curPassword: 'testuser' },
    };
    error = await getAndValidateForm('change-password-form', 'POST', loggedInRequest);
    expect(error).toEqual({
      code: 400,
      obj: {
        msg: 'Bad request. Validation errors.',
        errors: { password: 'Value is too short (minimum: 6 chars)' },
      },
    });
    loggedInRequest = {
      ...requests.request1,
      body: { password: 'testuserpass', curPassword: 'testuser' },
    };
    error = await getAndValidateForm('change-password-form', 'POST', loggedInRequest);
    expect(error).toEqual(null);
    console.log('TADAA', error);
  });
});
