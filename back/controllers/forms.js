import CryptoJS from 'crypto-js';
import { Router } from 'express';
import mongoose from 'mongoose';

import User from '../models/user.js';
import Form from '../models/form.js';
import UserSetting from '../models/userSetting.js';
import AdminSetting from '../models/adminSetting.js';
import logger from '../utils/logger.js';
import { validatePrivileges } from './forms/formEngine.js';
import {
  getSetting,
  getEnabledSettingsData,
  getFilteredSettings,
  checkIfAdminSettingEnabled,
} from '../utils/settingsService.js';

const formsRouter = Router();
const isValidObjectId = mongoose.isValidObjectId;

// Get all forms
formsRouter.get('/', async (request, response) => {
  // TODO: needs access right check, but for now, this is good for debugging
  const result = await Form.find({});
  response.json(result);
});

// Get form by id
formsRouter.get('/:id', async (request, response) => {
  let formId,
    splitId = [];
  const id = request.params.id;
  if (id.includes('+')) {
    splitId = id.split('+');
    formId = splitId[0];
  } else {
    formId = id;
  }
  let result = await Form.findOne({ formId });
  if (!result) {
    logger.log(`Could not find form with id '${formId}'.`);
    return response.status(404).json({ msg: 'Could not find form.', id: formId });
  }
  const error = await validatePrivileges(result, request);
  if (error) {
    return response.status(error.code).json(error.obj);
  }

  let form = result.form;
  form.id = result.formId;
  form.api = result.path;
  form.method = result.method;

  form = await _formatSpecialForms(request, form);

  if (splitId.length) {
    form.data = await getAdditionalData(formId, splitId[1], request, result);
    if (form.data._error) {
      logger.log(
        `Error with additional form data. FormId: '${formId}'. Additional Id: '${splitId[1]}'. (+ form.data._error)`,
        form.data._error
      );
      return response.status(form.data._error.code).json(form.data._error.obj);
    }
    if (form.singleEdit) {
      let fieldFound = false,
        fsFound = false;
      for (let i = 0; i < form.fieldsets.length; i++) {
        const fs = form.fieldsets[i];
        if (!fieldFound) {
          for (let j = 0; j < fs.fields.length; j++) {
            const field = fs.fields[j];
            if (form.data[field.id] !== undefined) {
              fieldFound = field;
              break;
            }
          }
        }
        if (!fsFound && fieldFound) {
          fs.fields = [{ type: 'divider' }, fieldFound, { type: 'divider' }];
          fsFound = fs;
          break;
        }
      }
      form.fieldsets = [fsFound];
    }
  }

  response.json(form);
});

const getAdditionalData = async (formId, dataId, request, formData) => {
  const userLevel = request.session.userLevel;
  if (formId === 'edit-user-form') {
    const user = await User.findById(dataId);
    if (!user) {
      return {
        _error: {
          code: 404,
          obj: {
            msg: 'Could not find user.',
            userNotFound: true,
          },
        },
      };
    } else if (user.userLevel >= userLevel) {
      return {
        _error: {
          code: 401,
          obj: {
            msg: 'Not authorised to edit user.',
            userLevelError: true,
          },
        },
      };
    }
    return user;
  } else if (formId === 'edit-profile-form' && dataId === 'own') {
    const user = await User.findById(request.session._id);
    if (!user) {
      return {
        _error: {
          code: 404,
          obj: {
            msg: 'Could not find user.',
            userNotFound: true,
          },
        },
      };
    }
    return user;
  } else if (formId === 'edit-expose-profile-form' && dataId !== undefined) {
    const usersCanEditSetting = await AdminSetting.findOne({
      settingId: 'users-can-set-exposure-levels',
    });
    if (dataId === 'own' && usersCanEditSetting.value !== 'true') {
      return {
        _error: {
          code: 401,
          obj: {
            msg: 'Users are not authorised to set exposure levels.',
            unauthorised: true,
          },
        },
      };
    }
    let userId = request.session._id;
    if (dataId !== 'own') userId = dataId;
    const user = await User.findById(userId);
    if (!user || !formData || !formData.form || !formData.form.fieldsets) {
      return {
        _error: {
          code: 404,
          obj: {
            msg: 'Could not find user/form.',
            userNotFound: true,
          },
        },
      };
    }
    const fieldsets = formData.form.fieldsets;
    for (let j = 0; j < fieldsets.length; j++) {
      const fields = fieldsets[j].fields;
      for (let k = 0; k < fields.length; k++) {
        if (fields[k].type === 'divider') continue;
        let showToUsers;
        if (formData.editorOptions && formData.editorOptions.showToUsers) {
          showToUsers = formData.editorOptions.showToUsers;
        }

        if (
          (!user.exposure || user.exposure[fields[k].id] === undefined) &&
          showToUsers[fields[k].id] &&
          showToUsers[fields[k].id].value
        ) {
          if (!user.exposure) user.exposure = {};
          user.exposure[fields[k].id] = fields[k].defaultValue;
        } else if (showToUsers[fields[k].id] && !showToUsers[fields[k].id].value) {
          delete user.exposure[fields[k].id];
          fieldsets[j].fields.splice(k, 1);
        }
      }
    }
    return user.exposure;
  } else if (formId === 'admin-settings-form') {
    let setting = await AdminSetting.findById(dataId);
    if (!setting) {
      return {
        _error: {
          code: 404,
          obj: {
            msg: 'Could not find admin setting.',
            settingNotFound: true,
          },
        },
      };
    }
    const settingValue = {};
    if (setting.password) {
      const bytes = CryptoJS.AES.decrypt(setting.value, process.env.SECRET);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      setting.value = originalText;
      setting[setting.settingId] = setting.value;
      settingValue[setting.settingId] = setting.value;
    } else {
      setting[setting.settingId] = setting.value;
      settingValue[setting.settingId] = setting.value;
    }
    return settingValue;
  } else if (formId === 'user-settings-form') {
    let setting;
    if (isValidObjectId(dataId)) {
      setting = await UserSetting.findById(dataId);
    } else {
      await getSetting(request, dataId, false, true); // Creates the setting
      setting = await UserSetting.findOne({ settingId: dataId, userId: request.session._id });
    }

    // Check if current setting is enabled
    const enabledSettings = await getEnabledSettingsData(request);
    const settingInArray = getFilteredSettings([setting], enabledSettings);

    if (!setting || !settingInArray.length) {
      return {
        _error: {
          code: 404,
          obj: {
            msg: 'Could not find user setting.',
            settingNotFound: true,
          },
        },
      };
    }

    setting[setting.settingId] = setting.value;
    const settingValue = {};
    settingValue[setting.settingId] = setting.value;
    return settingValue;
  } else if (formId === 'reset-password-w-token-form') {
    const isTheFeatureOn = getSetting(request, 'forgot-password-feature', true);
    if (!isTheFeatureOn) {
      logger.error(
        `Could not get reset password form (id: ${formId}) because the feature is turned off.`
      );
      return {
        _error: {
          code: 401,
          obj: {
            msg: 'Unauthorised.',
            unauthorised: true,
          },
        },
      };
    }
    const invalidResponse = () => {
      return {
        _error: {
          code: 401,
          obj: {
            msg: 'Token invalid or expired.',
            tokenError: true,
            customErrorTextId: 'invalid_or_expired_token',
          },
        },
      };
    };
    if (!dataId || dataId.length !== 64) return invalidResponse();
    const timeNow = new Date().getTime();
    let user = await User.findOne({ 'security.newPassLink.token': dataId });
    let expires = 0;
    if (!user || !user.security.newPassLink || !user.security.newPassLink.expires) {
      user = null;
    } else {
      expires = new Date(user.security.newPassLink.expires).getTime();
    }
    if (!user || expires < timeNow) return invalidResponse();
    return { tokenOk: true };
  } else {
    return {
      _error: {
        code: 400,
        obj: {
          msg: 'Not implemented.',
          notImplementedError: true,
        },
      },
    };
  }
};

const _formatSpecialForms = async (request, form) => {
  if (form.id === 'user-settings-form') {
    const enabledSettings = await getEnabledSettingsData(request);
    const fs = form.fieldsets;
    const removeSettings = [];
    for (let i = 0; i < fs.length; i++) {
      const fields = fs[i].fields;
      for (let j = 0; j < fields.length; j++) {
        if (fields[j].enabledId) {
          if (!checkIfAdminSettingEnabled(enabledSettings[fields[j].enabledId], fields[j].id)) {
            removeSettings.push(fields[j].id);
          }
        }
      }
    }
    const newForm = {
      ...form,
      fieldsets: form.fieldsets
        .map((fs) => {
          const fields = fs.fields.filter((field) => !removeSettings.includes(field.id));
          return {
            ...fs,
            fields,
          };
        })
        .filter((fs) => fs.fields.length),
    };
    return newForm;
  }
  return form;
};

export default formsRouter;
