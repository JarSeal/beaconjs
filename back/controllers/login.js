import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { Router } from 'express';

import User from '../models/user';
import Form from '../models/form';
import UserSetting from '../models/userSetting';
import logger from '../utils/logger';
import { createNewLoginLogsArray } from '../utils/helpers';
import { checkAccess, checkIfLoggedIn } from '../utils/checkAccess';
import { createRandomString } from '../../shared/parsers';
import { getSetting, getSettings, getPublicSettings, parseValue } from '../utils/settingsService';
import { sendEmailById } from '../utils/emailService';
import config from '../utils/config';

const loginRouter = Router();

loginRouter.post('/access', async (request, response) => {
  const result = {};
  let check, browserId;
  if (request.body.from === 'admin') {
    // Get the requester's useRightsLevel and editorRightsLevel matching formIds
    let userLevel = 0;
    if (request.session && request.session.userLevel) userLevel = request.session.userLevel;
    check = await Form.find({
      useRightsLevel: { $lte: userLevel },
      editorRightsLevel: { $lte: userLevel },
    });
    result.useRights = check
      .filter((form) => form.useRightsLevel <= userLevel)
      .map((form) => form.formId);
    result.editorRights = check
      .filter((form) => form.editorRightsLevel <= userLevel)
      .map((form) => form.formId);
  } else if (request.body.from === 'checklogin') {
    // Done at the beginning of a page refresh
    // Check if logged in and if the saved browserId is the same as the one saved in the session
    browserId = request.body.browserId;
    const settings = await getPublicSettings(request);
    if (checkIfLoggedIn(request.session) && browserId === request.session.browserId) {
      const user = await User.findOne({ username: request.session.username });
      if (user) {
        result.username = request.session.username;
        result.userLevel = request.session.userLevel || 0;
        // Check email and account verification
        result.accountVerified = null;
        request.session.verified = null;
        if (settings.useEmailVerification && !user.security.verifyEmail.verified) {
          result.accountVerified = false;
          request.session.verified = false;
        } else if (settings.useEmailVerification && user.security.verifyEmail.verified) {
          result.accountVerified = true;
          request.session.verified = true;
        }
      }
    }
    request.session.browserId = browserId;
    result.serviceSettings = settings;
  } else if (request.body.from === 'getCSRF') {
    if (!request.session) {
      result.sessionExpired = true;
    } else if (request.body.browserId && request.body.browserId === request.session.browserId) {
      const timestamp = +new Date();
      request.session.csrfSecret = timestamp + '-' + createRandomString(24);
      result.csrfToken = request.csrfToken();
    } else {
      logger.log(
        'Trying to getCSRF at /login/access but browserId is either invalid or missing. (+ sess, body)',
        request.session,
        request.body
      );
      return response.status(409).json({
        conflictError: true,
        errorMsg: 'browserId conflict',
        loggedIn: checkIfLoggedIn(request.session),
      });
    }
  } else if (request.body.from === 'logout') {
    if (request.session?.username) {
      request.session.destroy();
      if (request.cookies['connect.sid']) {
        response.clearCookie('connect.sid');
      }
    }
  } else {
    const ids = request.body.ids;
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      if (id.from === 'universe') {
        // TODO, do universe here (find by universeId)
      } else {
        // Default is 'Form'
        check = await Form.findOne({ formId: id.id });
      }
      const settings = await getSettings(request, true);
      result[id.id] = checkAccess(request, check, settings);
      result.serviceSettings = await getPublicSettings(request, true);
    }
  }
  result.loggedIn = checkIfLoggedIn(request.session);
  return response.json(result);
});

// Login, first phase if 2FA is enabled.
// If 2FA is not disabled, then this is
// the only route for Beacon login.
loginRouter.post('/', async (request, response) => {
  const body = request.body;

  // Get and check user
  const user = await User.findOne({ username: body.username });
  if (!user) {
    return response
      .status(_invalidUsernameOrPasswordResponse.statusCode)
      .json(_invalidUsernameOrPasswordResponse.sendObj);
  }

  // Check form
  const isFormInvalid = await _checkForm(user, body);
  if (isFormInvalid) {
    return response.status(isFormInvalid.statusCode).json(isFormInvalid.sendObj);
  }

  // Check here if the user is under cooldown period
  const isUnderCooldown = await _userUnderCooldown(request, user);
  if (isUnderCooldown) {
    return response.status(isUnderCooldown.statusCode).json(isUnderCooldown.sendObj);
  }

  // Check given password
  const isPasswordWrong = await _checkGivenPassword(user, request);
  if (isPasswordWrong) {
    return response.status(isPasswordWrong.statusCode).json(isPasswordWrong.sendObj);
  }

  // Check 2FA
  const is2FaEnabled = await _check2Fa(user, request, body);
  if (is2FaEnabled) {
    return response.status(is2FaEnabled.statusCode).json(is2FaEnabled.sendObj);
  }

  // After this part the login is successfull (without 2FA)
  // ****************************************

  // Clear newPassLink and attempts
  const isNotCleared = await _clearNewPassLinkAndLoginAttempts(user, body);
  if (isNotCleared) {
    return response.status(isNotCleared.statusCode).json(isNotCleared.sendObj);
  }

  await _createSessionAndRespond(request, response, user, body);
});

// 2FA login for phase two to check the code.
loginRouter.post('/two', async (request, response) => {
  const body = request.body;

  // Get and check user
  const user = await User.findOne({ username: body.username });

  // Check form
  const isFormInvalid = await _checkForm(user, body);
  if (isFormInvalid) {
    return response.status(isFormInvalid.statusCode).json(isFormInvalid.sendObj);
  }

  // Check here if the user is under cooldown period
  const isUnderCooldown = await _userUnderCooldown(request, user);
  if (isUnderCooldown) {
    return response.status(isUnderCooldown.statusCode).json(isUnderCooldown.sendObj);
  }

  // Check 2FA code
  const isTwoFACodeInvalid = await _check2FACode(request, user, body);
  if (isTwoFACodeInvalid) {
    return response.status(isTwoFACodeInvalid.statusCode).json(isTwoFACodeInvalid.sendObj);
  }

  // After this part the 2FA login is successfull
  // ********************************************

  // Clear newPassLink and attempts
  const isNotCleared = await _clearNewPassLinkAndLoginAttempts(user, body);
  if (isNotCleared) {
    return response.status(isNotCleared.statusCode).json(isNotCleared.sendObj);
  }

  await _createSessionAndRespond(request, response, user, body);
});

export const _getUserSecurity = (user) => {
  let userSecurity;
  if (user) {
    userSecurity = user.security ? user.security : {};
  }
  return {
    ...{
      loginAttempts: 0,
      coolDown: false,
      coolDownStarted: null,
      lastLogins: [],
      lastAttempts: [],
      newPassLink: {
        token: null,
        sent: null,
        expires: null,
      },
      verifyEmail: {
        token: null,
        oldEmail: null,
        verified: null,
      },
      twoFactor: {
        expires: null,
        nextCode: null,
      },
    },
    ...userSecurity,
  };
};

export const _invalidUsernameOrPasswordResponse = {
  statusCode: 401,
  sendObj: {
    error: 'invalid username and/or password',
    loggedIn: false,
  },
};

export const _serverErrorResponse = (loggedIn) => ({
  statusCode: 500,
  sendObj: {
    error: 'internal server error',
    loggedIn: loggedIn || false,
  },
});

const _userUnderCooldown = async (request, user) => {
  const timeNow = new Date();
  const userSecurity = _getUserSecurity(user);
  if (userSecurity && userSecurity.coolDown && userSecurity.coolDownStarted) {
    const cooldownTime = await getSetting(request, 'login-cooldown-time', true);
    const coolDownEnds = new Date(
      new Date(userSecurity.coolDownStarted).getTime() + cooldownTime * 60000
    );
    if (coolDownEnds < timeNow) {
      // Cooldown has ended, clear attempts
      userSecurity.loginAttempts = 0;
      userSecurity.coolDown = false;
      userSecurity.coolDownStarted = null;
      userSecurity.lastAttempts = [];
      const savedUser = await User.findByIdAndUpdate(
        user._id,
        { security: userSecurity },
        { new: true }
      );
      if (!savedUser) {
        logger.log(
          'Could not clear user attempts after cooldown. User was not found (id: ' + user._id + ').'
        );
      }
    } else {
      // User is in cooldown period, no logging in allowed
      return {
        statusCode: 403,
        sendObj: {
          error: 'user must wait a cooldown period before trying again',
          cooldownTime: cooldownTime,
          loggedIn: false,
        },
      };
    }
  }

  // All good, no cooldown
  return null;
};

const _checkGivenPassword = async (user, request) => {
  const userSecurity = _getUserSecurity(user);
  const body = request.body;
  const passwordCorrect =
    user === null ? false : await bcrypt.compare(body.password, user.passwordHash);
  const browserId = body.browserId;

  if (!(user && passwordCorrect && browserId && browserId.length === 32)) {
    if (user) {
      const maxLoginAttempts = await getSetting(request, 'max-login-attempts', true);
      userSecurity.loginAttempts = userSecurity.loginAttempts + 1 || 1;
      if (userSecurity.loginAttempts >= maxLoginAttempts) {
        userSecurity.coolDown = true;
        userSecurity.coolDownStarted = new Date();
        logger.log('User set to cooldown period (id: ' + user._id + ').');
      } else {
        userSecurity.coolDown = false;
        userSecurity.coolDownStarted = null;
      }

      userSecurity.lastAttempts = userSecurity.lastAttempts || [];
      userSecurity.lastAttempts.push({
        date: new Date(),
      });

      const savedUser = await User.findByIdAndUpdate(
        user._id,
        { security: userSecurity },
        { new: true }
      );
      if (!savedUser) {
        logger.log(
          'Could not update user security data after password check. User was not found (id: ' +
            user._id +
            ').'
        );
      }
    }

    return _invalidUsernameOrPasswordResponse;
  }

  // Password correct
  return null;
};

const _checkForm = async (user, body) => {
  const form = await Form.findOne({ formId: body.id });
  if (!form) {
    logger.error(`Could not find login form '${body.id}'.`);
    return {
      statusCode: 500,
      sendObj: {
        error: 'form missing or invalid',
        loggedIn: false,
      },
    };
  } else {
    if (
      form.editorOptions &&
      form.editorOptions.loginAccessLevel &&
      user.userLevel < form.editorOptions.loginAccessLevel.value
    ) {
      logger.log(
        `User level is too small to log in from '${body.id}'. Current requirement is '${form.editorOptions.loginAccessLevel.value}' while the user has '${user.userLevel}'.`,
        user._id
      );
      return _invalidUsernameOrPasswordResponse;
    }
  }

  // Form is OK
  return null;
};

const _check2Fa = async (user, request, body) => {
  const userSecurity = _getUserSecurity(user);
  const settings = await getSettings(request);
  if (
    !settings['email-sending'] ||
    !settings['use-email-verification'] ||
    settings['use-two-factor-authentication'] === 'disabled' ||
    !userSecurity.verifyEmail.verified
  ) {
    // 2FA needs email-sending, use-email-verification,
    // use-two-factor-authentication, and the user's
    // email to be verified for this to work
    return null;
  }
  if (settings['use-two-factor-authentication'] === 'users_can_choose') {
    const user2FASetting = await await UserSetting.findOne({
      settingId: 'enable-user-2fa-setting',
      userId: mongoose.Types.ObjectId(user._id),
    });
    const user2FAValue = parseValue(user2FASetting);
    // User has 2FA turned off
    if (!user2FAValue) return null;
  }

  // Create and send a new 2FA code and respond
  const timeNow = new Date();
  const twoFactorLife = await getSetting(request, 'two-factor-code-lifetime', true);
  let twoFactorCode = createRandomString(6, '0123456789QWERTY');
  if (config.ENV === 'test') {
    twoFactorCode = '123456';
  }
  userSecurity.twoFactor = {
    code: twoFactorCode,
    expires: new Date(timeNow.getTime() + twoFactorLife * 60000),
  };
  const savedUser = await User.findByIdAndUpdate(
    user._id,
    { security: userSecurity },
    { new: true }
  );
  if (!savedUser) {
    logger.log(
      'Could not update user security data for 2FA. User was not found (id: ' + user._id + ').'
    );
    return _serverErrorResponse();
  }
  const emailResult = await sendEmailById(
    'two-factor-auth-email',
    {
      to: savedUser.email,
      twoFactorCode,
      twoFactorLife,
    },
    request
  );
  if (!emailResult.emailSent) {
    return _serverErrorResponse();
  }
  return {
    statusCode: 200,
    sendObj: {
      proceedToTwoFa: true,
      loggedIn: false,
      username: savedUser.username,
      rememberMe: body['remember-me'],
    },
  };
};

const _clearNewPassLinkAndLoginAttempts = async (user, body) => {
  const userSecurity = _getUserSecurity(user);

  // Clear expired newPassLink token and date
  if (
    userSecurity.newPassLink &&
    userSecurity.newPassLink.token &&
    userSecurity.newPassLink.expires
  ) {
    const timeNow = new Date().getTime();
    let expires = userSecurity.newPassLink.expires;
    if (expires < timeNow) {
      userSecurity.newPassLink.token = null;
      userSecurity.newPassLink.expires = null;
      userSecurity.newPassLink.sent = null;
    }
  }

  // Clear attempts
  userSecurity.loginAttempts = 0;
  userSecurity.coolDown = false;
  userSecurity.coolDownStarted = null;
  userSecurity.lastAttempts = [];
  userSecurity.lastLogins = await createNewLoginLogsArray(userSecurity.lastLogins || [], {
    date: new Date(),
    browserId: body.browserId,
  });
  const savedUser = await User.findByIdAndUpdate(
    user._id,
    { security: userSecurity },
    { new: true }
  );
  if (!savedUser) {
    logger.log('Could not clear user attempts. User was not found (id: ' + user._id + ').');
    return _serverErrorResponse();
  }

  // All good
  return null;
};

const _createSessionAndRespond = async (request, response, user, body) => {
  const userSecurity = _getUserSecurity(user);

  // Create a new session:
  request.session.username = user.username;
  request.session.userLevel = user.userLevel;
  request.session._id = user._id;
  request.session.browserId = body.browserId;
  request.session.loggedIn = true;
  let sessionAge;
  const settings = await getPublicSettings(request);
  if (body['remember-me']) {
    sessionAge = await getSetting(request, 'remember-me-session-age', true, true);
    request.session.cookie.maxAge = sessionAge * 60 * 1000; // Milliseconds
  } else {
    sessionAge = await getSetting(request, 'session-age', true, true);
    if (!sessionAge || sessionAge < 300) sessionAge = 300; // Minimum 5 minutes
    request.session.cookie.maxAge = sessionAge * 60 * 1000; // Milliseconds
  }

  // Check email and account verification
  let accountVerified = null;
  request.session.verified = null;
  if (settings.useEmailVerification && !userSecurity.verifyEmail.verified) {
    accountVerified = false;
    request.session.verified = false;
  } else if (settings.useEmailVerification && userSecurity.verifyEmail.verified) {
    accountVerified = true;
    request.session.verified = true;
  }

  response.status(200).send({
    loggedIn: true,
    username: user.username,
    userLevel: user.userLevel,
    rememberMe: body['remember-me'],
    serviceSettings: settings,
    accountVerified,
  });
};

const _check2FACode = async (request, user, body) => {
  const userSecurity = _getUserSecurity(user);
  const userTwoFactor = userSecurity.twoFactor;
  const code = body.twofacode;
  const timestampNow = new Date().getTime();
  let invalidCodeResponse = {
    statusCode: 401,
    sendObj: {
      loggedIn: false,
      error: 'invalid or expired code',
    },
  };

  // Check validity of user data
  if (!userSecurity || !userTwoFactor || !userTwoFactor.expires || !userTwoFactor.code) {
    logger.log(`Could not clear user attempts. User was not found (id: ${user._id}).`);
    return _serverErrorResponse();
  }

  // Check if code hasn't expired
  if (new Date(userTwoFactor.expires).getTime() < timestampNow) {
    return invalidCodeResponse;
  }

  // Check if the code is correct
  if (code !== userTwoFactor.code) {
    const maxLoginAttempts = await getSetting(request, 'max-login-attempts', true);
    userSecurity.loginAttempts = userSecurity.loginAttempts + 1 || 1;
    if (userSecurity.loginAttempts >= maxLoginAttempts) {
      userSecurity.coolDown = true;
      userSecurity.coolDownStarted = new Date();
      logger.log(
        `User set to cooldown from too many incorrect 2FA codes period (id: ${user._id}).`
      );
    } else {
      userSecurity.coolDown = false;
      userSecurity.coolDownStarted = null;
    }

    userSecurity.lastAttempts = userSecurity.lastAttempts || [];
    userSecurity.lastAttempts.push({
      date: new Date(),
    });

    const savedUser = await User.findByIdAndUpdate(
      user.id,
      { security: userSecurity },
      { new: true }
    );
    if (!savedUser) {
      logger.log(
        `Could not update user security data after 2FA code check. User was not found (id: ${user._id}).`
      );
    }

    return invalidCodeResponse;
  }

  // Clear two factor data
  userSecurity.twoFactor.expires = null;
  userSecurity.twoFactor.code = null;
  const savedUser = await User.findByIdAndUpdate(
    user._id,
    { security: userSecurity },
    { new: true }
  );
  if (!savedUser) {
    logger.log(`Could not clear user twoFactor data. User was not found (id: ${user._id}).`);
    return _serverErrorResponse();
  }

  // All good, proceed
  return null;
};

export default loginRouter;
