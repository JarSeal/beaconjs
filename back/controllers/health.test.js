import axios from 'axios';

import startBackend from '../test/serverSetup';

describe('health controller', () => {
  startBackend();

  it('should test ok', async () => {
    const health = await axios.get('http://localhost:3001/api/health');
    expect(health.status).toEqual(200);
    expect(health.data).toEqual('ok');
  });
});
