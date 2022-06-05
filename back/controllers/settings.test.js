import axios from 'axios';

import startBackend from '../test/serverSetup';
import { createUserAndLogin } from '../test/utils';
import AdminSetting from '../models/adminSetting';

startBackend();

describe('settings controller', () => {
  it('should get all user settings', async () => {
    const loginData = await createUserAndLogin();
    await AdminSetting.findOneAndUpdate(
      { settingId: 'use-two-factor-authentication' },
      { value: 'disabled' }
    );
    let settings = await axios.get(
      'http://localhost:3001/api/settings',
      loginData.session.credentials
    );
    const tableSortingSetting = settings.data.filter(
      (s) => s.settingId === 'table-sorting-setting'
    );
    let twoFactorSetting = settings.data.filter((s) => s.settingId === 'enable-user-2fa-setting');
    expect(tableSortingSetting.length).toEqual(1);
    expect(twoFactorSetting.length).toEqual(0);
    await AdminSetting.findOneAndUpdate(
      { settingId: 'use-two-factor-authentication' },
      { value: 'users_can_choose' }
    );
    settings = await axios.get('http://localhost:3001/api/settings', loginData.session.credentials);
    twoFactorSetting = settings.data.filter((s) => s.settingId === 'enable-user-2fa-setting');
    expect(twoFactorSetting.length).toEqual(1);
  });
});
