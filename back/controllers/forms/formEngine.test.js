import Form from '../../models/form';
import {
  getAndValidateForm,
  validateField,
  validateKeys,
  validateFormData,
  validatePrivileges,
  getUserExposure,
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
  });

  // validateField
  it("should validate the form's fields", async () => {
    let formData = await Form.findOne({ formId: 'new-user-form' });

    // Textfield validation
    let error = validateField(formData.form, 'username', null);
    expect(error).toEqual('Required');
    error = validateField(formData.form, 'username', '');
    expect(error).toEqual('Required');
    error = validateField(formData.form, 'username');
    expect(error).toEqual('Required');
    error = validateField(formData.form, 'username', 5);
    expect(error.includes('Value is too short')).toEqual(true);
    error = validateField(formData.form, 'username', 'Toolongofanusernametobeusedinthissystem');
    expect(error.includes('Value is too long')).toEqual(true);
    error = validateField(formData.form, 'username', 'No spaces');
    expect(error).toEqual('Wrong format');
    error = validateField(formData.form, 'username', 'No$pecialchars');
    expect(error).toEqual('Wrong format');
    error = validateField(formData.form, 'username', 'ValidUsername');
    expect(error).toEqual(null);
    error = validateField(formData.form, 'name', 'John Doe');
    expect(error).toEqual(null);
    error = validateField(formData.form, 'name', '');
    expect(error).toEqual(null);
    error = validateField(formData.form, 'name', null);
    expect(error).toEqual(null);
    error = validateField(formData.form, 'name');
    expect(error).toEqual(null);

    // Textfield email
    error = validateField(formData.form, 'email', 'fdssd');
    expect(error).toEqual('Email not valid');
    error = validateField(formData.form, 'email', 'my.email@some');
    expect(error).toEqual('Email not valid');
    error = validateField(formData.form, 'email', 'my.email@some.');
    expect(error).toEqual('Email not valid');
    error = validateField(formData.form, 'email', 'my.email@some.i');
    expect(error).toEqual('Email not valid');
    error = validateField(formData.form, 'email', 'my.email@some.io');
    expect(error).toEqual(null);

    // Checkbox, required
    const checkboxForm1 = {
      fieldsets: [{ fields: [{ type: 'checkbox', id: 'testcheckbox', required: true }] }],
    };
    const checkboxForm2 = {
      fieldsets: [{ fields: [{ type: 'checkbox', id: 'testcheckbox' }] }],
    };
    error = validateField(checkboxForm1, 'testcheckbox');
    expect(error).toEqual('Required');
    error = validateField(checkboxForm1, 'testcheckbox', null);
    expect(error).toEqual('Required');
    error = validateField(checkboxForm1, 'testcheckbox', false);
    expect(error).toEqual('Required');
    error = validateField(checkboxForm1, 'testcheckbox', '');
    expect(error).toEqual('Required');
    error = validateField(checkboxForm1, 'testcheckbox', true);
    expect(error).toEqual(null);
    error = validateField(checkboxForm2, 'testcheckbox');
    expect(error).toEqual(null);
    error = validateField(checkboxForm2, 'testcheckbox', false);
    expect(error).toEqual(null);
    error = validateField(checkboxForm2, 'testcheckbox', true);
    expect(error).toEqual(null);

    // Dropdown
    formData = await Form.findOne({ formId: 'edit-expose-profile-form' });
    error = validateField(formData.form, 'name');
    expect(error).toEqual('Unknown value');
    error = validateField(formData.form, 'name', 'somevalue');
    expect(error).toEqual('Unknown value');
    error = validateField(formData.form, 'name', 4);
    expect(error).toEqual('Unknown value');
    error = validateField(formData.form, 'name', 0);
    expect(error).toEqual(null);
    error = validateField(formData.form, 'name', 1);
    expect(error).toEqual(null);
    error = validateField(formData.form, 'name', 2);
    expect(error).toEqual(null);
    formData = await Form.findOne({ formId: 'edit-user-form' });
    error = validateField(formData.form, 'userLevel', 'fdsa');
    expect(error).toEqual('Value is out of validation range.');
    error = validateField(formData.form, 'userLevel', 0);
    expect(error).toEqual('Value is out of validation range.');
    error = validateField(formData.form, 'userLevel', 10);
    expect(error).toEqual('Value is out of validation range.');
    error = validateField(formData.form, 'userLevel', 1);
    expect(error).toEqual(null);
    error = validateField(formData.form, 'userLevel', 8);
    expect(error).toEqual(null);

    // Textarea
    // TODO: add textarea tests here, once it is taken into use properly somewhere (maybe having a required property and so on)
  });

  // validateKeys
  it('should validate the submitted keys', async () => {
    let formData = await Form.findOne({ formId: 'new-user-form' });
    let keysAreValid = validateKeys(formData.form, []);
    expect(keysAreValid).toEqual(false);
    keysAreValid = validateKeys(formData.form, ['id']);
    expect(keysAreValid).toEqual(false);
    keysAreValid = validateKeys(formData.form, [
      'username',
      'name',
      'email',
      'password',
      'id',
      '_csrf',
    ]);
    expect(keysAreValid).toEqual(true);
    formData = await Form.findOne({ formId: 'beacon-main-login' });
    keysAreValid = validateKeys(formData.form, [
      'username',
      'password',
      'remember-me',
      'id',
      '_csrf',
    ]);
    expect(keysAreValid).toEqual(true);
  });

  // validateFormData
  it('should validate the submitted form data', async () => {
    const notLoggedInRequest = requests.request4;
    let formData = await Form.findOne({ formId: 'new-user-form' });
    let error = await validateFormData(formData, { ...notLoggedInRequest });
    expect(error).toEqual({
      code: 400,
      obj: { msg: 'Bad request. Payload missing or incomplete.' },
    });
    error = await validateFormData(formData, {
      ...notLoggedInRequest,
      body: { username: 'newUserName', password: 'somepassword' },
    });
    expect(error).toEqual({
      code: 400,
      obj: { msg: 'Bad request. Payload missing or incomplete.' },
    });
    error = await validateFormData(formData, {
      ...notLoggedInRequest,
      body: {
        username: 'newUserName',
        password: 'somepassword',
        email: 'newusersemail@somedomain.org',
        name: '',
      },
    });
    expect(error).toEqual(null);
    error = await validateFormData(formData, {
      ...notLoggedInRequest,
      body: {
        username: 'newUserName',
        password: 'somepassword',
        email: 'newusersemail@somedomain.org',
        name: '',
        id: 'new-user-form',
        _csrf: 'hjksdfhjksdfjhkhjksdfhjksdfa',
      },
    });
    expect(error).toEqual(null);
    error = await validateFormData(formData, {
      ...notLoggedInRequest,
      body: {
        username: '',
        password: 'somepassword',
        email: 'newusersemail@somedomain.org',
        name: '',
        id: 'new-user-form',
        _csrf: 'hjksdfhjksdfjhkhjksdfhjksdfa',
      },
    });
    expect(error).toEqual({
      code: 400,
      obj: { errors: { username: 'Required' }, msg: 'Bad request. Validation errors.' },
    });
  });

  // validatePrivileges
  it('should validate the privileges', async () => {
    const notLoggedInRequest = requests.request4;
    let formData = await Form.findOne({ formId: 'edit-profile-form' });
    let error = await validatePrivileges(formData, notLoggedInRequest);
    expect(error).toEqual({
      code: 401,
      obj: {
        msg: 'User not authenticated or session has expired',
        _sess: false,
        loggedIn: false,
      },
    });
    formData = await Form.findOne({ formId: 'new-user-form' });
    error = await validatePrivileges(formData, notLoggedInRequest);
    expect(error).toEqual(null);
    formData = await Form.findOne({ formId: 'beacon-main-login' });
    error = await validatePrivileges(formData, notLoggedInRequest);
    expect(error).toEqual(null);
  });

  // getUserExposure
  it("should get user's exposure fields and values", async () => {
    // If user is not given, this returns default values
    let values = await getUserExposure();
    expect(values.username).toEqual(0);
    expect(values.email).toEqual(2);
    values = await getUserExposure({ exposure: { name: 2, created_date: 0, email: 1 } });
    expect(values.username).toEqual(0);
    expect(values.name).toEqual(2);
    expect(values.email).toEqual(1);
  });
});
