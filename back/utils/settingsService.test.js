import connectTestMongo from '../test/mongoSetup';
import AdminSetting from '../models/adminSetting';
import UserSetting from '../models/userSetting';
import { getSettings, getSetting } from './settingsService';
import { requests } from '../test/dummyData';

connectTestMongo();

describe('settingsService', () => {
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

  // Do tests for these:
  // - parseValue
  // - getPublicSettings
  // - getFilteredSettings
});

const setUserSetting = async (id, userId, value) => {
  const sett = await UserSetting.findOne({ settingId: id, userId: userId });
  if (sett) {
    await UserSetting.findOneAndUpdate({ settingId: id, userId }, { value });
  } else {
    const newSett = new UserSetting({
      settingId: id,
      userId,
      value,
      defaultValue: '',
      type: 'string',
    });
    await newSett.save();
  }
};
