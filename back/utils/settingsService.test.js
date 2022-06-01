import connectTestMongo from '../test/mongoSetup';
import { getSettings } from './settingsService';

connectTestMongo();

describe('settingsService', () => {
  it('should get all settings', async () => {
    const settingsFirstLoad = await getSettings(null);
    expect(Object.keys(settingsFirstLoad).length > 10).toEqual(true);
    const settingsSecondLoad = await getSettings(null, true);
    expect(settingsFirstLoad).toEqual(settingsSecondLoad);
  });
});
