import axios from 'axios';

import startBackend from '../test/serverSetup';
import config from '../utils/config';

describe('health controller', () => {
  startBackend();

  it('should test ok', async () => {
    const health = await axios.get(`${config.getApiBaseUrl('http://localhost')}/health`);
    expect(health.status).toEqual(200);
    expect(health.data).toEqual('ok');
  });
});
