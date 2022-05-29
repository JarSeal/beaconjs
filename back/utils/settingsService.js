import AdminSetting from '../models/adminSetting.js';
import Form from '../models/form.js';
import UserSetting from '../models/userSetting.js';
import userSettingsFormData from '../../shared/formData/userSettingsFormData.js';
import { checkIfLoggedIn } from './checkAccess.js';

let all = {},
  onceLoaded = false;

const reloadSettings = async (request) => {
  const adminSettings = await AdminSetting.find({});
  all = {};
  let userLevel = 0;
  const loggedIn = checkIfLoggedIn(request.session);
  if (loggedIn) userLevel = request.session.userLevel;
  for (let i = 0; i < adminSettings.length; i++) {
    if (userLevel >= adminSettings[i].settingReadRight) {
      all[adminSettings[i].settingId] = parseValue(adminSettings[i]);
    }
  }
  if (loggedIn) {
    const fieldSets = userSettingsFormData.form.fieldsets;
    for (let i = 0; i < fieldSets.length; i++) {
      const fs = fieldSets[i];
      for (let j = 0; j < fs.fields.length; j++) {
        const field = fs.fields[j];
        const setting = await UserSetting.findOne({
          userId: request.session._id,
          settingId: field.id,
        });
        if (!setting) {
          all[field.id] = await getDefaultValue(field.id, request);
        } else {
          all[field.id] = parseValue(setting);
        }
      }
    }
  }
  onceLoaded = true;
};

const getSettings = async (request, noReload) => {
  if (!noReload || !onceLoaded) {
    await reloadSettings(request);
  }
  return all;
};

const getSetting = async (request, id, admin, noReload) => {
  if (!noReload) {
    const loggedIn = checkIfLoggedIn(request.session);
    let setting;
    admin
      ? (setting = await AdminSetting.findOne({ settingId: id }))
      : loggedIn
      ? (setting = await UserSetting.findOne({ settingId: id, userId: request.session._id }))
      : null;
    if (!setting) return null;
    let userLevel = 0;
    if (loggedIn) userLevel = request.session.userLevel;
    if (userLevel >= setting.settingReadRight)
      all[id] = setting ? parseValue(setting) : await getDefaultValue(setting, request);
  }
  let value = all[id];
  if (value === undefined) {
    let setting = await UserSetting.findOne({ settingId: id, userId: request.session._id });
    value = setting ? parseValue(setting) : await getDefaultValue(id, request);
  }
  return value;
};

const getDefaultValue = async (setting, request) => {
  const fieldSets = userSettingsFormData.form.fieldsets;
  for (let i = 0; i < fieldSets.length; i++) {
    const fs = fieldSets[i];
    for (let j = 0; j < fs.fields.length; j++) {
      const field = fs.fields[j];
      if (setting.settingId === field.id || setting === field.id) {
        const newSetting = new UserSetting({
          settingId: field.id,
          userId: request.session._id,
          value: field.defaultValue,
          defaultValue: field.defaultValue,
          type: field.settingType,
          enabledId: field.enabledId,
        });
        await newSetting.save();
        return field.defaultValue;
      }
    }
  }
  return null;
};

const parseValue = (setting) => {
  if (setting.type === 'integer') {
    return parseInt(setting.value);
  }
  if (setting.type === 'boolean') {
    return setting.value === 'true' ? true : false;
  }
  // String by default
  return setting.value;
};

const getPublicSettings = async (request, noReload) => {
  if (!noReload || !onceLoaded) {
    await reloadSettings(request);
  }
  const publicSettings = {};
  const keys = Object.keys(publicSettingsRemapping);
  for (let i = 0; i < keys.length; i++) {
    const newKey = publicSettingsRemapping[keys[i]].newKey;
    publicSettings[newKey] = await publicSettingsRemapping[keys[i]].createValue(
      all[keys[i]],
      request
    );
  }
  publicSettings['_routeAccess'] = await _createPublicRouteAccesses(request);
  return publicSettings;
};

const _createPublicRouteAccesses = async (request) => {
  const routes = await Form.find({ type: 'view' });
  const accesses = {};
  const curUserLevel = request.session.userLevel || 0;
  for (let i = 0; i < routes.length; i++) {
    const routeUseLevel = routes[i].useRightsLevel;
    const formId = routes[i].formId;
    accesses[formId] = curUserLevel >= routeUseLevel;
  }
  return accesses;
};

// Change settings keys and values before making them public
const publicSettingsRemapping = {
  'public-user-registration': {
    newKey: 'canCreateUser',
    createValue: (value, request) => {
      if (checkIfLoggedIn(request.session)) {
        return all['user-level-required-to-register'] <= request.session.userLevel;
      }
      return value;
    },
  },
  'table-sorting-setting': {
    newKey: 'tableSorting',
    createValue: (value) => value,
  },
  'users-can-set-exposure-levels': {
    newKey: 'canSetExposure',
    createValue: (value) => value,
  },
  'forgot-password-feature': {
    newKey: 'forgotPass',
    createValue: (value) => value,
  },
  'use-email-verification': {
    newKey: 'useEmailVerification',
    createValue: async (value, request) => {
      const sendEmails = await getSetting(request, 'email-sending', true, true);
      if (sendEmails) return value;
      return false;
    },
  },
};

// Get relevant admin settings that might prevent
// users from setting some settings
const getEnabledSettingsData = async (request) => {
  const enabledSettings = {};
  let value, key;

  key = 'use-two-factor-authentication';
  value = await getSetting(request, key, true);
  enabledSettings[key] = value;

  return enabledSettings;
};

const getFilteredSettings = (settings, enabledSettings) => {
  return settings.filter((s) => {
    if (!s.enabledId) return true;
    return checkIfAdminSettingEnabled(enabledSettings[s.enabledId], s.id);
  });
};

const checkIfAdminSettingEnabled = (settingValue, settingId) => {
  if (settingId === 'enable-user-2fa-setting') {
    const emailSendingEnabled = all['email-sending'];
    const emailVerificationEnabled = all['use-email-verification'];
    if (
      (settingValue !== undefined &&
        (settingValue === 'disabled' || settingValue === 'enabled_always')) ||
      !emailSendingEnabled ||
      !emailVerificationEnabled
    )
      return false;
  }
  return true;
};

export {
  getSettings,
  getSetting,
  parseValue,
  getPublicSettings,
  getEnabledSettingsData,
  getFilteredSettings,
  checkIfAdminSettingEnabled,
};
