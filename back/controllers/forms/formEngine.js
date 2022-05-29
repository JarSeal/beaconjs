import csrf from 'csurf';

import Form from '../../models/form.js';
import shared from '../../shared/index.js';
import logger from './../../utils/logger.js';
import { checkAccess, checkIfLoggedIn } from '../../utils/checkAccess.js';
import { getSettings } from '../../utils/settingsService.js';
import editExposeProfileFormData from '../../../shared/formData/editExposeProfileFormData.js';
import AdminSetting from '../../models/adminSetting.js';

export const getAndValidateForm = async (formId, method, request) => {
  let error = null;
  const formData = await Form.findOne({ formId });

  if (method === 'GET') {
    error = await validatePrivileges(formData, request);
  } else if (method === 'POST' || method === 'PUT') {
    error = await validateFormData(formData, request);
  }

  if (error) {
    logger.log(
      'Unauthorised, getAndValidateForm failed. (+ error, formId, session)',
      error,
      formId,
      request.session
    );
  }

  return error;
};

export const validateField = (form, key, value) => {
  if (key === 'id') return null;

  let fieldsets = form.fieldsets;
  if (!fieldsets) return null;
  for (let i = 0; i < fieldsets.length; i++) {
    const fieldset = fieldsets[i];
    for (let j = 0; j < fieldset.fields.length; j++) {
      const field = fieldset.fields[j];
      if (field.id === key) {
        switch (field.type) {
          case 'textinput':
            return textInput(field, value.trim());
          case 'checkbox':
            return checkbox(field, value);
          case 'dropdown':
            return dropdown(field, value);
          case 'textarea':
            return textArea(field, value.trim());
          default:
            return checkAllowedFieldTypes(field.type);
        }
      }
    }
  }
};

const textInput = (field, value) => {
  if (field.required && (!value || value === '')) return 'Required';
  if (field.minLength && value.length < field.minLength && value !== '')
    return `Value is too short (minimum: ${field.minLength} chars)`;
  if (field.maxLength && value.length > field.maxLength)
    return `Value is too long (maximum: ${field.maxLength} chars)`;
  if (field.email && value.length && !shared.parsers.validateEmail(value)) return 'Email not valid';
  if (value.length && field.regex) {
    const regex = new RegExp(field.regex);
    if (!regex.test(value)) return 'Wrong format';
  }
  return null;
};

const checkbox = (field, value) => {
  if (field.required && (!value || value === false)) return 'Required';
  return null;
};

const dropdown = (field, value) => {
  if (field.required && String(value).trim() === '') return 'Required';
  // Validate that the value passed is one of the options
  if (field.options) {
    let valueFound = false;
    for (let i = 0; i < field.options.length; i++) {
      if (String(field.options[i].value).trim() === String(value).trim()) {
        valueFound = true;
        break;
      }
    }
    if (!valueFound) {
      logger.log(
        'A value was presented that is not one of the options for a dropdown. (+ value, field)',
        value,
        field
      );
      return 'Unknown value';
    }
  } else if ((field.minValue || field.minValue === 0) && (field.maxValue || field.maxValue === 0)) {
    if (field.minValue > value || field.maxValue < value) {
      logger.log('Value is out of validation range for a dropdown. (+ value, field)', value, field);
      return 'Value is out of validation range.';
    }
  } else {
    logger.log(
      'No validation provided. No options or minValue and maxValue for a dropdown. (+ value, field)',
      value,
      field
    );
    return 'No validation provided. Needs to have options or minValue and maxValue defined.';
  }
  return null;
};

const textArea = (field, value) => {
  if (field.required && (!value || value === '')) return 'Required';
  if (field.minLength && value.length < field.minLength && value !== '')
    return `Value is too short (minimum: ${field.minLength} chars)`;
  if (field.maxLength && value.length > field.maxLength)
    return `Value is too long (maximum: ${field.maxLength} chars)`;
  if (value.length && field.regex) {
    const regex = new RegExp(field.regex);
    if (!regex.test(value)) return 'Wrong format';
  }
  return null;
};

export const checkAllowedFieldTypes = (type) => {
  if (type === 'divider' || type === 'subheading' || type === 'subdescription') {
    return null;
  }
  return 'Field type not found.';
};

export const validateKeys = (form, keys) => {
  if (keys.length < 2) return false;
  const submitFields = form.submitFields;
  let keysFound = 0;
  for (let i = 0; i < submitFields.length; i++) {
    for (let j = 0; j < keys.length; j++) {
      if (submitFields[i] === keys[j]) {
        keysFound++;
        break;
      }
    }
  }
  return keysFound === submitFields.length;
};

export const validateFormData = async (formData, request) => {
  const body = request.body;
  if (!formData || !formData.form) {
    return {
      code: 404,
      obj: { msg: 'Could not find form (' + body.id + '),' },
    };
  }

  const error = await validatePrivileges(formData, request);
  if (error) return error;

  const keys = Object.keys(body);
  if (!formData.form.singleEdit) {
    const keysFound = validateKeys(formData.form, keys);
    if (!keysFound) {
      return {
        code: 400,
        obj: { msg: 'Bad request. Payload missing or incomplete.' },
      };
    }
  }

  const errors = {};
  for (let i = 0; i < keys.length; i++) {
    // Payload contains extra/undefined keys or no keys at all
    let error = validateField(formData.form, keys[i], body[keys[i]]);
    if (error) errors[keys[i]] = error;
  }
  const errorKeys = Object.keys(errors);
  if (errorKeys.length) {
    return {
      code: 400,
      obj: { msg: 'Bad request. Validation errors.', errors },
    };
  }

  return null;
};

export const validatePrivileges = async (form, request) => {
  const settings = await getSettings(request, true);
  if (form.useRightsLevel && form.useRightsLevel !== 0) {
    const sess = request.session;
    if (!checkIfLoggedIn(sess)) {
      logger.log(
        `User not authenticated or session has expired. Trying to access form with id ${form.formId}.`
      );
      return {
        code: 401,
        obj: {
          msg: 'User not authenticated or session has expired.',
          _sess: false,
          loggedIn: false,
        },
      };
    }
  }

  if (!checkAccess(request, form, settings)) {
    logger.error(`User not authorised. Trying to access form with id ${form.formId}.`);
    return {
      code: 401,
      obj: {
        unauthorised: true,
        msg: 'User not authorised.',
      },
    };
  }
};

export const csrfProtection = csrf({ cookie: false });
let crsfToken = null;
export const csrfNewToken = (request) => {
  if (request.crsfToken && !crsfToken) crsfToken = request.crsfToken;
  return crsfToken();
};

export const getUserExposure = async (user) => {
  const exposeDefaultsFormId = editExposeProfileFormData.formId;
  const defaultValues = await Form.findOne({ formId: exposeDefaultsFormId });
  const usersCanEditSetting = await AdminSetting.findOne({
    settingId: 'users-can-set-exposure-levels',
  });
  const userUsersExposesSetting = await AdminSetting.findOne({
    settingId: 'use-users-exposure-levels',
  });
  const exposures = {};
  const fieldsets = defaultValues.form.fieldsets;
  for (let i = 0; i < fieldsets.length; i++) {
    const fs = fieldsets[i];
    for (let j = 0; j < fs.fields.length; j++) {
      const field = fs.fields[j];
      if (field.type === 'divider') continue;
      exposures[field.id] = field.defaultValue;
      if (
        (usersCanEditSetting.value === 'true' || userUsersExposesSetting.value === 'true') &&
        user.exposure[field.id] !== undefined
      ) {
        exposures[field.id] = user.exposure[field.id];
      }
    }
  }
  return exposures;
};

const formEngine = {
  getAndValidateForm,
  validateField,
  validateKeys,
  validateFormData,
  validatePrivileges,
  csrfProtection,
  csrfNewToken,
  getUserExposure,
};

export default formEngine;
