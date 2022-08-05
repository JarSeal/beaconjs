import validationFns from './validationFns';
import { State } from '../../../LIGHTER';

describe('validationFns', () => {
  it('should validate the password fields', async () => {
    // Create a new dummy components with password and password-again
    const fieldErrors = new State();
    const components = {
      password: {
        value: 'somepassword',
        data: { field: { minLength: 8 } },
        displayFieldError: () => {},
      },
      'password-again': {
        value: 'fds',
        data: { field: { minLength: 0 } },
        displayFieldError: () => {},
      },
    };
    validationFns.validatePass1({
      val: 'somepassword',
      components,
      id: 'password',
      fieldErrors,
      fieldsetId: 'fieldset-id',
    });
    expect(fieldErrors.get('password').errorMsg).toBe(' ');
    expect(fieldErrors.get('password-again').errorMsgId).toBe('passwords_dont_match');
    expect(fieldErrors.get('password-again').fieldsetId).toBe('fieldset-id');
    expect(fieldErrors.get('password-again').id).toBe('password');
    validationFns.validatePass2({
      val: 'fds',
      components,
      id: 'password-again',
      fieldErrors,
      fieldsetId: 'fieldset-id',
    });
    expect(fieldErrors.get('password').errorMsg).toBe(' ');
    expect(fieldErrors.get('password-again').errorMsgId).toBe('passwords_dont_match');
    expect(fieldErrors.get('password-again').fieldsetId).toBe('fieldset-id');
    expect(fieldErrors.get('password-again').id).toBe('password-again');
    components['password-again'].value = 'somepassword';
    validationFns.validatePass1({
      val: 'somepassword',
      components,
      id: 'password',
      fieldErrors,
      fieldsetId: 'fieldset-id',
    });
    expect(fieldErrors.get('password')).toBe(false);
    expect(fieldErrors.get('password-again')).toBe(false);
    validationFns.validatePass2({
      val: 'somepassword',
      components,
      id: 'password-again',
      fieldErrors,
      fieldsetId: 'fieldset-id',
    });
    expect(fieldErrors.get('password')).toBe(false);
    expect(fieldErrors.get('password-again')).toBe(false);
  });
});
