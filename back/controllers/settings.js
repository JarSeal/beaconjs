import CryptoJS from 'crypto-js';
import mongoose from 'mongoose';
import { Router } from 'express';

import UserSetting from '../models/userSetting.js';
import AdminSetting from '../models/adminSetting.js';
import Form from '../models/form.js';
import logger from '../utils/logger.js';
import adminSettingsFormData from '../../shared/formData/adminSettingsFormData.js';
import userSettingsFormData from '../../shared/formData/userSettingsFormData.js';
import { createNewEditedArray } from './../utils/helpers.js';
import { getAndValidateForm } from './forms/formEngine.js';
import {
  getPublicSettings,
  getEnabledUserSettingsData,
  getFilteredSettings,
  checkIfAdminSettingEnabled,
} from '../utils/settingsService.js';

const settingsRouter = Router();

// Get all user settings values
settingsRouter.get('/', async (request, response) => {
  const formId = userSettingsFormData.formId;
  const error = await getAndValidateForm(formId, 'GET', request);
  if (error) {
    return response.status(error.code).json(error.obj);
  }

  const result = await UserSetting.find({ userId: request.session._id });
  const enabledSettings = await getEnabledUserSettingsData(request);
  const filteredResult = getFilteredSettings(result, enabledSettings);

  response.json(filteredResult);
});

// Edit user settings
settingsRouter.put('/', async (request, response) => {
  const body = request.body;
  const error = await getAndValidateForm(body.id, 'PUT', request);
  if (error) {
    return response.status(error.code).json(error.obj);
  }

  if (!mongoose.isValidObjectId(body.mongoId)) {
    return response.status(400).json({
      msg: 'MongoId not valid ID',
      mongoIdNotValid: true,
    });
  }

  const setting = await UserSetting.findById(body.mongoId);
  const enabledSettings = await getEnabledUserSettingsData(request);

  if (!setting) {
    logger.error(
      'Could not find user setting. Setting was not found (id: ' + body.mongoId + '). (+ body)',
      body
    );
    return response.status(404).json({
      msg: 'Setting was not found',
      settingNotFoundError: true,
    });
  } else if (body[setting.settingId] === null || body[setting.settingId] === undefined) {
    logger.error(
      "Could not find value with key '" +
        setting.settingId +
        "' in the payload for editing a user setting. (+ body)",
      body
    );
    return response.status(400).json({
      msg: 'Bad request',
      settingValueNotFoundError: true,
    });
  } else if (!checkIfAdminSettingEnabled(enabledSettings[setting.enabledId], setting.settingId)) {
    logger.error(
      `Could not update user setting. Setting is either disabled, always enabled (${
        enabledSettings[setting.enabledId]
      }), or email or verification is not enabled. (+ body)`,
      body
    );
    return response.status(401).json({
      msg: 'Unauthorised',
      unauthorised: true,
    });
  }

  const updatedUserSetting = {
    value: body[setting.settingId],
  };

  const savedSetting = await UserSetting.findByIdAndUpdate(body.mongoId, updatedUserSetting, {
    new: true,
  });
  if (!savedSetting) {
    logger.error(
      'Could not find user setting after save. Setting was not found (id: ' +
        body.mongoId +
        '). (+ body)',
      body
    );
    return response.status(404).json({
      msg: 'Setting was not found',
      settingNotFoundError: true,
    });
  }
  logger.log(`Setting '${savedSetting.settingId}' was changed (user setting).`);
  const publicSettings = await getPublicSettings(request);
  response.json(publicSettings);
});

// Get all admin settings values
settingsRouter.get('/admin', async (request, response) => {
  const formId = adminSettingsFormData.formId;
  const error = await getAndValidateForm(formId, 'GET', request);
  if (error) {
    return response.status(error.code).json(error.obj);
  }

  const result = await AdminSetting.find({});

  // Decrypt passwords
  for (let i = 0; i < result.length; i++) {
    const setting = result[i];
    if (setting.password) {
      const bytes = CryptoJS.AES.decrypt(setting.value, process.env.SECRET);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      result[i].value = originalText;
    }
  }

  response.json(result);
});

// Edit admin settings
settingsRouter.put('/admin', async (request, response) => {
  const body = request.body;
  const error = await getAndValidateForm(body.id, 'PUT', request);
  if (error) {
    return response.status(error.code).json(error.obj);
  }

  if (!mongoose.isValidObjectId(body.mongoId)) {
    return response.status(400).json({
      msg: 'MongoId not valid ID',
      mongoIdNotValid: true,
    });
  }

  const setting = await AdminSetting.findById(body.mongoId);

  if (!setting) {
    logger.error(
      'Could not find admin setting. Setting was not found (id: ' + body.mongoId + '). (+ body)',
      body
    );
    return response.status(404).json({
      msg: 'Setting was not found',
      settingNotFoundError: true,
    });
  } else if (body[setting.settingId] === null || body[setting.settingId] === undefined) {
    logger.error(
      "Could not find value with key '" +
        setting.settingId +
        "' in the payload for editing an admin setting. (+ body)",
      body
    );
    return response.status(400).json({
      msg: 'Bad request',
      settingValueNotFoundError: true,
    });
  }

  const edited = await createNewEditedArray(setting.edited, request.session._id);
  let value = body[setting.settingId];

  if (setting.password && value !== '') {
    value = CryptoJS.AES.encrypt(value, process.env.SECRET).toString();
  }

  const updatedAdminSetting = {
    value,
    edited,
  };

  const savedSetting = await AdminSetting.findByIdAndUpdate(body.mongoId, updatedAdminSetting, {
    new: true,
  });
  if (!savedSetting) {
    logger.error(
      'Could not find admin setting after save. Setting was not found (id: ' +
        body.mongoId +
        '). (+ body)',
      body
    );
    return response.status(404).json({
      msg: 'Setting was not found',
      settingNotFoundError: true,
    });
  }
  logger.log(`Setting '${savedSetting.settingId}' was changed (admin setting).`);
  const publicSettings = await getPublicSettings(request);
  response.json(publicSettings);
});

// Get apis' data
settingsRouter.get('/apis', async (request, response) => {
  const formId = 'route-settings-api-settings';
  const error = await getAndValidateForm(formId, 'GET', request);
  if (error) {
    return response.status(error.code).json(error.obj);
  }

  const sortBy = request.query.sortBy || 'formId',
    sortOrder = request.query.sortOr === 'asc' ? -1 : 1,
    itemsPerPage = request.query.itemsPerPage ? parseInt(request.query.itemsPerPage) : 25,
    page = request.query.page || 1,
    search = request.query.search || '',
    searchCaseSensitive = request.query.caseSensitive === 'true',
    searchFields = request.query.searchFields?.length
      ? request.query.searchFields.split(',')
      : ['formId', 'path', 'method'];

  const searchRegex = new RegExp(search, searchCaseSensitive ? '' : 'i');
  const findConditions = {
    $and: [
      {
        $or: [
          { editorRightsLevel: { $lte: request.session.userLevel } },
          { editorRightsUsers: request.session._id },
          // @TODO: add groups check here as well
          // @TODO: check owner here as well
        ],
      },
      {
        $or: [
          ...searchFields.map((field) => {
            field = field.trim();
            if (field.includes('.date')) {
              // TODO: implement search by a date,
              // send also the date format from the frontend,
              // then check if the format of the search string is a valid date,
              // then convert the date to a date object (or timestamp, test this)
              // and then compare the date with the $gte on the date and $lt on the next day.
              logger.error('Trying to search by a date. Not supported yet.');
              return { nonExistingField: searchRegex }; // Temp
            }
            return {
              [field]: searchRegex,
            };
          }),
        ],
      },
    ],
  };

  const totalCount = await Form.find(findConditions).countDocuments();
  const result = await Form.find(findConditions)
    .sort([
      [sortBy, sortOrder],
      ['formId', sortOrder],
    ])
    .skip((page - 1) * itemsPerPage)
    .limit(itemsPerPage);

  response.json({
    totalCount,
    result,
  });
});

export default settingsRouter;
