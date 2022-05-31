import mongoose from 'mongoose';

import config from '../utils/config.js';

const connectTestMongo = () => {
  beforeAll(async () => {
    await mongoose
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
    await mongoose.connection.close();
  });
};

export default connectTestMongo;
