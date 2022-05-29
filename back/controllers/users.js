import bcrypt from 'bcrypt';
import { Router } from 'express';

import {
  isValidObjectId,
  createNewEditedArray,
  checkIfEmailTaken,
  getUserEmail,
} from '../utils/helpers.js';
import shared from '../shared/index.js';
import readUsersFormData from '../../shared/formData/deleteUsersFormData.js';
import readOneUserFormData from '../../shared/formData/readOneUserFormData.js';
import readProfileFormData from '../../shared/formData/readProfileFormData.js';
import editExposeProfileFormData from '../../shared/formData/editExposeProfileFormData.js';
import verifyAccountWToken from '../../shared/formData/verifyAccountWToken.js';
import emailVerificationFormData from './../../shared/formData/emailVerificationFormData.js';
import logger from '../utils/logger.js';
import User from '../models/user.js';
import UserSetting from '../models/userSetting.js';
import Form from '../models/form.js';
import { getAndValidateForm, getUserExposure } from './forms/formEngine.js';
import { checkIfLoggedIn } from '../utils/checkAccess.js';
import { sendEmailById } from '../utils/emailService.js';
import { createRandomString } from '../../shared/parsers.js';
import { getSetting } from '../utils/settingsService.js';

const usersRouter = Router();
const CONFIG = shared.CONFIG;

// Get all users (for admins)
usersRouter.get('/', async (request, response) => {
  // Get formData, get user, and check the user's admin rights
  const formId = readUsersFormData.formId;
  const error = await getAndValidateForm(formId, 'GET', request);
  if (error) {
    return response.status(error.code).json(error.obj);
  }

  // Get the users that have smaller user level than the current user
  const result = await User.find({ userLevel: { $lt: parseInt(request.session.userLevel) } });

  // const result = await User.find({}).populate('userGroups', {
  //     name: 1, id: 1
  // });
  response.json(result);
});

// Get one user
usersRouter.get('/:userId', async (request, response) => {
  const formId = readOneUserFormData.formId;
  const error = await getAndValidateForm(formId, 'GET', request);
  if (error) {
    return response.status(error.code).json(error.obj);
  }

  const userId = request.params.userId;
  let userToView = await User.findOne({ username: userId })
    .populate('edited.by', { username: 1 })
    .populate('created.by', { username: 1 });
  if (!userToView) {
    if (isValidObjectId(userId)) {
      userToView = await User.findById(userId)
        .populate('edited.by', { username: 1 })
        .populate('created.by', { username: 1 });
    }
  }

  if (!userToView) {
    logger.log('Could not find user with this id: ' + userId + ' (+ session)', request.session);
    return response.status(404).json({
      msg: 'User was not found.',
      userNotFoundError: true,
    });
  }

  // Exposure check
  const requesterUserLevel = request.session.userLevel || 0;
  let publishUser = {};
  const exposures = await getUserExposure(userToView);
  const formData = await Form.findOne({ formId });
  if (requesterUserLevel >= formData.editorRightsLevel) {
    // Viewer is an admin show all info
    publishUser = userToView;
    publishUser.exposure = exposures;
  } else {
    const exposureKeys = Object.keys(exposures);
    for (let i = 0; i < exposureKeys.length; i++) {
      const key = exposureKeys[i];
      if (exposures[key] === 0 || (exposures[key] === 1 && requesterUserLevel > 0)) {
        if (key.includes('_')) {
          // Deep object
          const parts = key.split('_');
          let value = userToView[parts[0]];
          let path = {};
          path[parts[0]] = {};
          for (let p = 1; p < parts.length; p++) {
            value = value[parts[p]];
            // This is sort of hard coded and should be improved (supports now x levels of nesting in the object)
            const isTheEnd = p === parts.length - 1;
            if (p === 1 && isTheEnd) {
              publishUser[parts[0]] = {};
              publishUser[parts[0]][parts[1]] = value;
              break;
            }
            if (p === 2 && isTheEnd) {
              publishUser[parts[0]] = {};
              publishUser[parts[0]][parts[1]] = {};
              publishUser[parts[0]][parts[1]][parts[2]] = value;
              break;
            }
            if (p === 3 && isTheEnd) {
              publishUser[parts[0]] = {};
              publishUser[parts[0]][parts[1]] = {};
              publishUser[parts[0]][parts[1]][parts[2]] = {};
              publishUser[parts[0]][parts[1]][parts[2]][parts[3]] = value;
              break;
            }
            if (p === 4 && isTheEnd) {
              publishUser[parts[0]] = {};
              publishUser[parts[0]][parts[1]] = {};
              publishUser[parts[0]][parts[1]][parts[2]] = {};
              publishUser[parts[0]][parts[1]][parts[2]][parts[3]] = {};
              publishUser[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]] = value;
              break;
            }
            if (p === 5 && isTheEnd) {
              publishUser[parts[0]] = {};
              publishUser[parts[0]][parts[1]] = {};
              publishUser[parts[0]][parts[1]][parts[2]] = {};
              publishUser[parts[0]][parts[1]][parts[2]][parts[3]] = {};
              publishUser[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]] = {};
              publishUser[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]][parts[5]] = value;
              break;
            }
          }
          continue;
        }
        // First level object
        publishUser[key] = userToView[key];
      }
    }
  }

  // For security reasons, show 404 even if the user exists
  if (Object.keys(publishUser).length === 0) {
    logger.log(
      'Unauthorised. Not high enough userLevel to view current user (all fields were above the requester userLevel). Returning 404 for security reasons. (+ session, userId)',
      request.session,
      userId
    );
    return response.status(404).json({
      msg: 'User was not found.',
      userNotFoundError: true,
    });
  }

  response.json(publishUser);
});

// Edit user
usersRouter.put('/', async (request, response) => {
  const body = request.body;
  const error = await getAndValidateForm(body.id, 'PUT', request);
  if (error) {
    return response.status(error.code).json(error.obj);
  }

  if (CONFIG.USER.email.required) {
    const emailTaken = await checkIfEmailTaken(body.email, body.userId);
    if (emailTaken) {
      return response.json({
        msg: 'Bad request. Validation errors.',
        errors: { email: 'email_taken' },
        emailTaken: true,
      });
    }
  }

  // Validate userLevel
  const curLevel = request.session.userLevel;
  if (body.userLevel >= curLevel) {
    logger.log(
      'Unauthorised. Not high enough userLevel. (+ user to update level, session)',
      body.userLevel,
      request.session
    );
    return response.status(401).json({
      unauthorised: true,
      msg: 'User not authorised.',
    });
  } else if (body.userLevel < 1) {
    logger.log(
      'Trying to save userLevel lower than 1. (+ user to update level, session)',
      body.userLevel,
      request.session
    );
    return response.status(400).json({
      badRequest: true,
      msg: 'Bad request.',
    });
  }

  const user = await User.findById(body.userId);
  const verifyEmail = await _createOldEmail(request, user, body.email);
  const edited = await createNewEditedArray(user.edited, request.session._id);
  const updatedUser = Object.assign(
    {},
    {
      email: body.email.trim(),
      name: body.name.trim(),
      userLevel: parseInt(body.userLevel),
      edited,
    },
    verifyEmail
  );

  const savedUser = await User.findByIdAndUpdate(body.userId, updatedUser, { new: true });
  if (!savedUser) {
    logger.log('Could not update user. User was not found (id: ' + body.userId + ').');
    return response.status(404).json({
      msg: 'User to update was not found. It has propably been deleted by another user.',
      userNotFoundError: true,
    });
  }
  response.json(savedUser);
});

// Delete users
usersRouter.post('/delete', async (request, response) => {
  const body = request.body;
  const error = await getAndValidateForm(body.id, 'POST', request);
  if (error) {
    return response.status(error.code).json(error.obj);
  }

  // Check if the user being deleted exists and
  // that the user deleting has a higher userLevel
  // than the user about to be deleted
  const users = body.users;
  const usernames = [];
  const errors = [];
  for (let i = 0; i < users.length; i++) {
    const user = await User.findById(users[i]);
    if (!user) {
      logger.log('Could not find user to delete (id: ' + users[i] + ').');
      errors.push({
        userId: users[i],
        userNotFoundError: true,
        errorMsg: 'User not found.',
      });
      continue;
    } else if (user.userLevel >= request.session.userLevel) {
      logger.log(
        'Could not delete user (id: ' +
          users[i] +
          '). Not high enough userLevel. (+ user.userLevel)',
        user.userLevel
      );
      errors.push({
        userId: users[i],
        notAllowedToDeleteUserError: true,
        errorMsg: 'Not allowed to delete user (userLevel lower or same than user being deleted).',
      });
      continue;
    }
    await User.findByIdAndRemove(users[i], (err, data) => {
      if (err) {
        logger.error(
          'Error while trying to delete a user (id: ' + users[i] + '). (+ error)',
          error
        );
        errors.push({
          error,
          dbError: true,
          user,
        });
      } else {
        if (data && data.username) {
          usernames.push(data.username);
        }
      }
    });
    const settings = await UserSetting.find({ userId: users[i] });
    for (let j = 0; j < settings.length; j++) {
      await UserSetting.findByIdAndRemove(settings[j]._id, (err) => {
        if (err) {
          logger.error(
            'Error while trying to delete a user setting (user id: ' +
              users[i] +
              ', setting id: ' +
              settings[j]._id +
              '). (+ error)',
            error
          );
          errors.push({
            error,
            dbError: true,
            user,
          });
        }
      });
    }
  }

  const responseObject = {
    deletionResponse: true,
    allDeleted: !errors.length,
    deleted: usernames,
  };
  if (errors.length) responseObject.errors = errors;
  response.json(responseObject);
});

// Register user
usersRouter.post('/', async (request, response) => {
  const body = request.body;
  const error = await getAndValidateForm(body.id, 'POST', request);
  if (error) {
    return response.status(error.code).json(error.obj);
  }

  const findUsername = await User.findOne({ username: body.username.trim() });
  if (findUsername) {
    return response.json({
      msg: 'Bad request. Validation errors.',
      errors: { username: 'username_taken' },
      usernameTaken: true,
    });
  }
  if (CONFIG.USER.email.required) {
    const emailTaken = await checkIfEmailTaken(body.email);
    if (emailTaken) {
      return response.json({
        msg: 'Bad request. Validation errors.',
        errors: { email: 'email_taken' },
        emailTaken: true,
      });
    }
  }

  const passwordHash = await bcrypt.hash(body.password, CONFIG.USER.password.saltRounds);

  const userCount = await User.find({}).limit(1);
  const formData = await Form.findOne({ formId: body.id });
  let userLevel =
    formData.editorOptions && formData.editorOptions.newUserLevel
      ? formData.editorOptions.newUserLevel.value || 1
      : 1;

  let createdBy = null;
  if (checkIfLoggedIn(request.session)) createdBy = request.session._id;

  if (userCount.length === 0) {
    // First registration is always for a super admin (level 9)
    userLevel = 9; // Create admin user
    logger.log(`Created a super user (level: ${userLevel}) (public form).`);
  } else {
    logger.log(
      `Created a level ${userLevel} user. (${createdBy ? 'creator: ' + createdBy : 'public form'})`
    );
  }

  const user = new User({
    username: body.username.trim(),
    email: body.email.trim(),
    name: body.name.trim(),
    userLevel,
    passwordHash,
    created: {
      by: createdBy,
      publicForm: createdBy ? false : true,
      date: new Date(),
    },
  });

  const savedUser = await user.save();

  if (!savedUser) {
    logger.error('Could not save new user.');
    return response.status(500).json({
      msg: 'Internal error. Server Could not save new user.',
      internalError: true,
    });
  }

  if (savedUser.email) {
    await sendEmailById(
      'new-user-email',
      {
        to: savedUser.email,
        username: savedUser.username,
      },
      request
    );
    const useVerification = await getSetting(request, 'use-email-verification', true);
    if (useVerification) {
      const verificationSent = await _sendVerificationEmail(request, response, savedUser);
      if (!verificationSent) return;
    }
  }

  response.json(savedUser);
});

// Read own profile
usersRouter.get('/own/profile', async (request, response) => {
  const formId = readProfileFormData.formId;
  const error = await getAndValidateForm(formId, 'GET', request);
  if (error) {
    return response.status(error.code).json(error.obj);
  }

  const userId = request.session._id;
  let userToView = await User.findById(userId)
    .populate('edited.by', { username: 1 })
    .populate('created.by', { username: 1 });

  if (!userToView) {
    logger.log('Could not find user with this id: ' + userId + ' (+ session)', request.session);
    return response.status(404).json({
      msg: 'User was not found. It has propably been deleted.',
      userNotFoundError: true,
    });
  }

  const exposures = await getUserExposure(userToView);
  userToView.exposure = exposures;

  response.json(userToView);
});

// Edit own profile
usersRouter.put('/own/profile', async (request, response) => {
  const body = request.body;
  const userId = request.session._id;
  const error = await getAndValidateForm(body.id, 'PUT', request);
  if (error) {
    return response.status(error.code).json(error.obj);
  }

  const user = await User.findById(userId);
  const passwordCorrect =
    user === null ? false : await bcrypt.compare(body.curPassword, user.passwordHash);
  if (!passwordCorrect) {
    return response.status(401).json({
      error: 'invalid password',
      loggedIn: true,
      noRedirect: true,
      errors: { curPassword: 'wrong_password' },
    });
  }

  if (CONFIG.USER.email.required) {
    const emailTaken = await checkIfEmailTaken(body.email, userId);
    if (emailTaken) {
      return response.json({
        msg: 'Bad request. Validation errors.',
        errors: { email: 'email_taken' },
        emailTaken: true,
      });
    }
  }

  // Check if the session user is the same as target
  if (!user || user.username !== request.session.username) {
    logger.error(
      "Could not update user's own profile. User was not found or does not match the session user (id: " +
        body.userId +
        ').'
    );
    return response.json({
      msg: 'Bad request.',
      badRequest: true,
    });
  }

  const verifyEmail = await _createOldEmail(request, user, body.email);
  const edited = await createNewEditedArray(user.edited, userId);
  const updatedUser = Object.assign(
    {},
    {
      email: body.email.trim(),
      name: body.name.trim(),
      edited,
    },
    verifyEmail
  );

  const savedUser = await User.findByIdAndUpdate(userId, updatedUser, { new: true });
  if (!savedUser) {
    logger.error("Could not update user's own profile. User was not found (id: " + userId + ').');
    return response.status(404).json({
      msg: 'User to update was not found. It has propably been deleted by another user.',
      userNotFoundError: true,
    });
  }
  const newEmailToken = verifyEmail['security.verifyEmail']?.token;
  if (newEmailToken) {
    sendEmailById(
      'verify-account-email',
      {
        to: body.email.trim(),
        username: user.username,
        verifyEmailTokenUrl: CONFIG.UI.baseUrl + CONFIG.UI.basePath + '/u/verify/' + newEmailToken,
      },
      request
    );
  }
  response.json(savedUser);
});

// Edit exposure values
usersRouter.put('/user/exposure', async (request, response) => {
  const body = request.body;
  let userId = request.session._id;
  let editingOwnProfile = true;
  if (body.userId && body.userId !== userId) {
    userId = body.userId;
    editingOwnProfile = false;
    delete body.userId;
  }
  const user = await User.findById(userId);

  if (editingOwnProfile) {
    const userCanExpose = await getSetting(request, 'users-can-set-exposure-levels', true);
    if (!userCanExpose) {
      return response.status(401).json({
        msg: 'Unauthorised. Users cannot set exposure levels.',
        unauthorised: true,
      });
    }

    const passwordCorrect =
      user === null ? false : await bcrypt.compare(body.curPassword, user.passwordHash);
    if (!passwordCorrect) {
      return response.status(401).json({
        error: 'invalid password',
        loggedIn: true,
        noRedirect: true,
        errors: { curPassword: 'wrong_password' },
      });
    }
  }

  const error = await getAndValidateForm(body.id, 'PUT', request);
  if (error) {
    return response.status(error.code).json(error.obj);
  }

  const exposure = {};
  const exposureFormId = editExposeProfileFormData.formId;
  const exposureFormData = await Form.findOne({ formId: exposureFormId });
  if (!editingOwnProfile && exposureFormData.editorRightsLevel > request.session.userLevel) {
    logger.error(
      "Could not update user's own profile exposure. Editor's user level is too low. (+ editorId, required level)",
      request.session._id,
      exposureFormData.editorRightsLevel
    );
    return response.status(401).json({
      msg: 'Unauthorised.',
      unauthorised: true,
    });
  }
  const showToUsers = exposureFormData.editorOptions.showToUsers;
  const fieldsets = exposureFormData.form.fieldsets;
  for (let i = 0; i < fieldsets.length; i++) {
    const fs = fieldsets[i];
    for (let j = 0; j < fs.fields.length; j++) {
      const field = fs.fields[j];
      if (
        field.id !== 'curPassword' &&
        body[field.id] !== undefined &&
        !field.disabled &&
        showToUsers[field.id].value
      ) {
        exposure[field.id] = body[field.id];
      }
    }
  }

  let updatedUser = {};
  if (Object.keys(exposure).length) {
    const edited = await createNewEditedArray(user.edited, request.session._id);
    updatedUser = {
      exposure,
      edited,
    };
  } else {
    return response.status(400).json({
      msg: 'Bad request. No valid fields to update were found.',
      noFieldsFound: true,
    });
  }

  const savedUser = await User.findByIdAndUpdate(userId, updatedUser, { new: true });
  if (!savedUser) {
    logger.error(
      "Could not update user's own profile exposure. User was not found (id: " + userId + ').'
    );
    return response.status(404).json({
      msg: 'User to update was not found.',
      userNotFoundError: true,
    });
  }

  return response.json(savedUser);
});

// Delete own profile
usersRouter.post('/own/delete', async (request, response) => {
  const body = request.body;
  const userId = request.session._id;
  const user = await User.findById(userId);
  const passwordCorrect =
    user === null ? false : await bcrypt.compare(body.password, user.passwordHash);
  if (!passwordCorrect) {
    return response.status(401).json({
      error: 'invalid password',
      loggedIn: true,
    });
  }

  // Superadmin cannot be self-deleted
  if (request.session.userLevel === 9) {
    return response.status(403).json({
      error: 'unauthorised',
      loggedIn: true,
    });
  }

  // Delete the user
  User.findByIdAndRemove(userId, (err, user) => {
    if (err) {
      logger.error('Could not self delete profile. (+ userId, err)', userId, err);
      return response.status(500).json({
        error: 'db error',
        dbError: true,
      });
    }

    const email = getUserEmail(user);
    if (email) {
      sendEmailById(
        'delete-own-account-email',
        {
          to: email,
          username: user.username,
        },
        request
      );
    }

    return response.json({ userDeleted: true });
  });
});

// Change password
usersRouter.post('/own/changepass', async (request, response) => {
  const body = request.body;
  const userId = request.session._id;
  const user = await User.findById(userId);
  const passwordCorrect =
    user === null ? false : await bcrypt.compare(body.curPassword, user.passwordHash);
  if (!passwordCorrect) {
    return response.status(401).json({
      error: 'invalid password',
      loggedIn: true,
      noRedirect: true,
      errors: { curPassword: 'wrong_password' },
    });
  }

  const passwordHash = await bcrypt.hash(body.password, CONFIG.USER.password.saltRounds);

  const edited = await createNewEditedArray(user.edited, request.session._id);
  const updatedUser = {
    passwordHash,
    edited,
  };

  const savedUser = await User.findByIdAndUpdate(userId, updatedUser, { new: true });
  if (!savedUser) {
    logger.error("Could not update user's password. User was not found (id: " + userId + ').');
    return response.status(404).json({
      msg: 'User to update was not found.',
      userNotFoundError: true,
    });
  }

  const email = getUserEmail(user);
  if (email) {
    sendEmailById(
      'password-changed-email',
      {
        to: user.email,
        username: user.username,
      },
      request
    );
  }

  response.json(savedUser);
});

// Request a new password link
usersRouter.post('/newpassrequest', async (request, response) => {
  const monoResponse = () => {
    // For security reasons
    return response.json({ tryingToSend: true });
  };

  const isTheFeatureOn = getSetting(request, 'forgot-password-feature', true);
  if (!isTheFeatureOn) {
    logger.error('Could not create a "reset password" link because the feature is turned off.');
    return monoResponse();
  }

  const body = request.body;
  const email = body.email.trim();

  let user = await User.findOne({ email: email });
  if (!user) user = await User.findOne({ 'security.verifyEmail.oldEmail': email });
  if (user) {
    // Check if email has been already sent
    const coolDownTime = 6000; // 10 minutes in ms
    const timeNow = new Date();
    if (user.security && user.security.newPassLink && user.security.newPassLink.sent) {
      const lastSent = new Date(user.security.newPassLink.sent);
      if (timeNow.getTime() < lastSent.getTime() + coolDownTime) {
        return monoResponse();
      }
    }

    const newToken = createRandomString(64, true); // Maybe improve this by checking for token collision
    const linkLife = await getSetting(request, 'new-pass-link-lifetime', true);
    const newPassLinkAndDate = {
      token: newToken,
      sent: timeNow,
      expires: new Date(timeNow.getTime() + linkLife * 60000),
    };
    const savedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: { 'security.newPassLink': newPassLinkAndDate } },
      { new: true }
    );
    if (!savedUser) {
      logger.error(
        "Could not update user's newPassLink and date. User was not found (id: " + user._id + ').'
      );
      return monoResponse();
    }

    // Send email here
    sendEmailById(
      'new-pass-link-email',
      {
        to: email,
        username: savedUser.username,
        newPassWTokenUrl: CONFIG.UI.baseUrl + CONFIG.UI.basePath + '/u/newpass/' + newToken,
        linkLife,
      },
      request
    );
  }

  return monoResponse();
});

// Save new password with token
usersRouter.post('/newpass', async (request, response) => {
  const isTheFeatureOn = getSetting(request, 'forgot-password-feature', true);
  if (!isTheFeatureOn) {
    logger.error('Could not create a "reset password" link because the feature is turned off.');
    return response.status(404).json({ error: 'unknown endpoint' });
  }

  const body = request.body;
  const error = await getAndValidateForm(body.id, 'POST', request);
  if (error) {
    return response.status(error.code).json(error.obj);
  }

  // Check token
  const timeNow = new Date().getTime();
  let user = await User.findOne({ 'security.newPassLink.token': body.token });
  let expires = 0;
  if (!user || !user.security.newPassLink || !user.security.newPassLink.expires) {
    user = null;
  } else {
    expires = new Date(user.security.newPassLink.expires).getTime();
  }
  if (!user || expires < timeNow) {
    return response.status(401).json({
      msg: 'Token invalid or expired.',
      tokenError: true,
    });
  }

  // Create a new password, destroy the token, create new edited item
  const passwordHash = await bcrypt.hash(body.password, CONFIG.USER.password.saltRounds);

  const edited = await createNewEditedArray(user.edited, request.session._id);
  const updatedUser = {
    passwordHash,
    edited,
    $set: {
      'security.newPassLink': {
        token: null,
        sent: null,
        expires: null,
      },
    },
  };

  const savedUser = await User.findByIdAndUpdate(user._id, updatedUser, { new: true });
  if (!savedUser) {
    logger.error("Could not update user's password. User was not found (id: " + user._id + ').');
    return response.status(404).json({
      msg: 'User to update was not found.',
      userNotFoundError: true,
    });
  }

  const email = getUserEmail(user);
  if (email) {
    sendEmailById(
      'password-changed-email',
      {
        to: user.email,
        username: user.username,
      },
      request
    );
  }

  return response.json({ passwordUpdated: true });
});

// Verify user account with token
usersRouter.get('/verify/:token', async (request, response) => {
  // TODO: update api documentation
  const formId = verifyAccountWToken.formId;
  const error = await getAndValidateForm(formId, 'GET', request);
  if (error) {
    return response.status(error.code).json(error.obj);
  }

  const token = request.params.token;
  const user = await User.findOne({ 'security.verifyEmail.token': token });
  if (!user) {
    return response.status(401).json({
      msg: 'Token invalid or expired.',
      tokenError: true,
    });
  }

  const verifyEmail = {
    token: null,
    oldEmail: null,
    verified: true,
  };
  const updatedUser = {
    $set: { 'security.verifyEmail': verifyEmail },
  };
  const savedUser = await User.findByIdAndUpdate(user._id, updatedUser, { new: true });
  if (!savedUser) {
    logger.error(
      "Could not update user's account verification status. User was not found (id: " +
        user._id +
        ').'
    );
    return response.status(404).json({
      msg: 'User to update was not found.',
      userNotFoundError: true,
    });
  }

  return response.json({
    verified: true,
    username: user.username,
  });
});

// Send a new E-mail verification link
usersRouter.post('/newemailverification', async (request, response) => {
  // TODO: update api documentation
  const formId = emailVerificationFormData.formId;
  const error = await getAndValidateForm(formId, 'GET', request);
  if (error) {
    return response.status(error.code).json(error.obj);
  }

  const user = await User.findById(request.session._id);
  if (!user) {
    logger.error(
      `Could not find a user by id to send verification to (user id: ${request.session._id}).`
    );
    return response.status(404).json({
      msg: 'User not found',
      userNotFoundError: true,
    });
  }

  const useVerification = await getSetting(request, 'use-email-verification', true);
  if (
    useVerification &&
    user.security &&
    user.security.verifyEmail &&
    !user.security.verifyEmail.verified
  ) {
    const verificationSent = await _sendVerificationEmail(request, response, user);
    if (!verificationSent) return;
  } else {
    logger.error(
      `Trying to send a new verification, but it is prohibited (user id: ${request.session._id}, useVerification: ${useVerification})`
    );
    return response.status(401).json({
      msg: 'Unauthorised',
      unauthorised: true,
    });
  }

  return response.json({ newVerificationSent: true });
});

const _sendVerificationEmail = async (request, response, user) => {
  const newEmailToken = createRandomString(64, true); // Maybe improve this by checking for token collision
  const verifyEmail = {
    'security.verifyEmail': {
      token: newEmailToken,
      oldEmail: user.security.verifyEmail.oldEmail,
      verified: false,
    },
  };
  const savedUser = await User.findByIdAndUpdate(user._id, verifyEmail, { new: true });
  if (!savedUser) {
    logger.error("Could not update user's own profile. User was not found (id: " + user._id + ').');
    response.status(404).json({
      msg: 'User to update was not found. It has propably been deleted by another user.',
      userNotFoundError: true,
    });
    return false;
  }
  sendEmailById(
    'verify-account-email',
    {
      to: user.email,
      username: user.username,
      verifyEmailTokenUrl: CONFIG.UI.baseUrl + CONFIG.UI.basePath + '/u/verify/' + newEmailToken,
    },
    request
  );
  return true;
};

const _createOldEmail = async (request, user, newEmail) => {
  let verifyEmail = {},
    newEmailToken;
  const useVerification = await getSetting(request, 'use-email-verification', true);
  const emailSending = await getSetting(request, 'email-sending', true, true);
  if (emailSending && useVerification && newEmail.trim() !== user.email) {
    newEmailToken = createRandomString(64, true); // Maybe improve this by checking for token collision
    let oldEmail =
      user.security.verifyEmail && user.security.verifyEmail.verified ? user.email : null;
    if (!oldEmail) {
      oldEmail =
        user.security.verifyEmail && user.security.verifyEmail.oldEmail
          ? user.security.verifyEmail.oldEmail
          : null;
    }
    verifyEmail = {
      'security.verifyEmail': {
        token: newEmailToken,
        oldEmail,
        verified: false,
      },
    };
  } else if (!emailSending || !useVerification) {
    verifyEmail = { 'security.verifyEmail': {} };
  }
  return verifyEmail;
};

export default usersRouter;
