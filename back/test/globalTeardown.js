import { getConn } from './globalSetup.js';

const globalTeardown = async () => {
  const conn = getConn();
  await conn.connection.db.dropDatabase(() => {
    conn.connection.close();
  });
};

export default globalTeardown;
