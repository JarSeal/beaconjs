import mongoose from 'mongoose';

import config from '../utils/config.js';

const globalTeardown = async () => {
  // const conn = getConn();
  // await conn.connection.db.dropDatabase(() => {
  //   conn.connection.close();
  // });
  await mongoose
    .connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    })
    .then(async (conn) => {
      await conn.connection.db.dropDatabase(() => {
        conn.connection.close();
      });
    })
    .catch((error) => {
      console.error('\n\nerror connection to MongoDB:', error.message, '\n\n');
    });
};

export default globalTeardown;
