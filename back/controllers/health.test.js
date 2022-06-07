import axios from 'axios';

import startBackend from '../test/serverSetup';

startBackend();

describe('health controller', () => {
  it('should test ok', async () => {
    const health = await axios.get('http://localhost:3001/api/health');
    expect(health.status).toEqual(200);
    expect(health.data).toEqual('ok');
  });
});
