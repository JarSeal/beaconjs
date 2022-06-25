import connectTestMongo from '../test/mongoSetup';
import AdminSetting from '../models/adminSetting';
import UserSetting from '../models/userSetting';
import {
  getSettings,
  getSetting,
  parseValue,
  getPublicSettings,
  getFilteredSettings,
  getEnabledUserSettingsData,
} from './settingsService';
import { requests } from '../test/dummyData';
import { setUserSetting } from '../test/utils';

describe('settingsService', () => {
  connectTestMongo();

  it('should get all settings', async () => {
    const request = requests.request2;
    const settingsFirstLoad = await getSettings(request);
    expect(Object.keys(settingsFirstLoad).length > 10).toEqual(true);
    const settingsSecondLoad = await getSettings(request, true);
    expect(settingsFirstLoad).toEqual(settingsSecondLoad);
  });

  it('should get one setting according to settingId', async () => {
    const request = requests.request2;
    setUserSetting('table-sorting-setting', request.session._id, 'session');
    setUserSetting('enable-user-2fa-setting', request.session._id, 'false');
    await AdminSetting.findOneAndUpdate(
      { settingId: 'use-two-factor-authentication' },
      { value: 'disabled' }
    );
    await getSettings(request);

    const setting1 = await getSetting(request, 'table-sorting-setting');
    expect(setting1).toEqual('session');
    const setting2 = await getSetting(request, 'enable-user-2fa-setting');
    expect(setting2).toEqual(false);
    const setting3 = await getSetting(request, 'use-two-factor-authentication', true);
    expect(setting3).toEqual('disabled');
  });

  it('should parse out the value of a setting in the type provided', () => {
    const settings = [
      { type: 'string', value: 'Value as a string' },
      { type: 'string', value: '' },
      { type: 'integer', value: '23' },
      { type: 'integer', value: '-23' },
      { type: 'boolean', value: 'true' },
      { type: 'boolean', value: 'false' },
    ];
    expect(parseValue(settings[0])).toEqual('Value as a string');
    expect(typeof parseValue(settings[0])).toEqual('string');
    expect(parseValue(settings[1])).toEqual('');
    expect(parseValue(settings[2])).toEqual(23);
    expect(typeof parseValue(settings[2])).toEqual('number');
    expect(parseValue(settings[3])).toEqual(-23);
    expect(typeof parseValue(settings[3])).toEqual('number');
    expect(parseValue(settings[4])).toEqual(true);
    expect(typeof parseValue(settings[4])).toEqual('boolean');
    expect(parseValue(settings[5])).toEqual(false);
    expect(typeof parseValue(settings[5])).toEqual('boolean');
  });

  it('should get all public settings that are sent to the client', async () => {
    const request = requests.request4;
    const publicSettings = await getPublicSettings(request);
    expect(Object.keys(publicSettings).length > 0).toEqual(true);
    expect(Object.keys(publicSettings._routeAccess).length > 0).toEqual(true);
    // eslint-disable-next-line no-prototype-builtins
    expect(publicSettings.hasOwnProperty('canCreateUser')).toEqual(true);
    // eslint-disable-next-line no-prototype-builtins
    expect(publicSettings.hasOwnProperty('tableSorting')).toEqual(true);
    // eslint-disable-next-line no-prototype-builtins
    expect(publicSettings.hasOwnProperty('forgotPass')).toEqual(true);
  });

  it('should get all filtered settings', async () => {
    const request = requests.request2;
    await AdminSetting.findOneAndUpdate(
      { settingId: 'use-two-factor-authentication' },
      { value: 'disabled' }
    );
    await getSettings(request);
    setUserSetting('table-sorting-setting', request.session._id, 'session');
    setUserSetting('enable-user-2fa-setting', request.session._id, 'false');
    const result = await UserSetting.find({ userId: request.session._id });
    const enabledSettings = await getEnabledUserSettingsData(request);
    const filtered = getFilteredSettings(result, enabledSettings);

    const emptyArray = filtered.filter((s) => s.settingId === 'enable-user-2fa-setting');
    expect(emptyArray.length).toEqual(0);

    const sortingSetting = filtered.filter((s) => s.settingId === 'table-sorting-setting');
    expect(sortingSetting.length).toEqual(1);
  });
});
