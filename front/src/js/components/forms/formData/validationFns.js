const validationFns = {
  validatePass1: (args) => {
    const { val, components, id, fieldErrors, fieldsetId } = args;
    const pass2Val = components['password-again'].value;
    const minLength = components['password'].data.field.minLength;
    if (
      val.length >= minLength &&
      pass2Val.length >= 1 &&
      val !== components['password-again'].value
    ) {
      fieldErrors.set('password-again', {
        errorMsgId: 'passwords_dont_match',
        fieldsetId,
        id,
      });
      fieldErrors.set('password', { errorMsg: ' ' });
    } else if (
      (minLength === undefined || val.length >= minLength) &&
      val === components['password-again'].value
    ) {
      fieldErrors.set('password-again', false);
      fieldErrors.set('password', false);
    }
    components['password-again'].displayFieldError();
  },
  validatePass2: (args) => {
    const { val, components, id, fieldErrors, fieldsetId } = args;
    const pass1Val = components['password'].value;
    const minLength = components['password'].data.field.minLength;
    if (val.length >= 1 && val !== components['password'].value) {
      fieldErrors.set('password-again', {
        errorMsgId: 'passwords_dont_match',
        fieldsetId,
        id,
      });
      if (!fieldErrors.get('password')) fieldErrors.set('password', { errorMsg: ' ' });
    } else if (
      val.length >= 1 &&
      val === components['password'].value &&
      (minLength === undefined || pass1Val.length >= minLength)
    ) {
      fieldErrors.set('password-again', false);
      fieldErrors.set('password', false);
    }
    components['password'].displayFieldError();
  },
};

export default validationFns;
