import mongoose from 'mongoose';

import config from '../utils/config.js';

let mongoConn2;

const connectTestMongo = () => {
  beforeAll(async () => {
    mongoConn2 = await mongoose
      .connect(config.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
      })
      .catch((error) => {
        console.error('\n\nerror connection to MongoDB:', error.message, '\n\n');
      });
  });

  afterAll(async () => {
    await mongoConn2.connection.close();
  });
};

export default connectTestMongo;
