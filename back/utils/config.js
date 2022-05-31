import { config } from 'dotenv';

config();

const ENV = process.env.NODE_ENV;

const PORT = process.env.PORT;
let MONGODB_URI = process.env.MONGODB_URI;

if (ENV === 'test') {
  MONGODB_URI = process.env.TEST_MONGODB_URI;
}

const SECRET = process.env.SECRET;

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const conf = { ENV, MONGODB_URI, PORT, EMAIL_HOST, EMAIL_USER, EMAIL_PASS, SECRET };

export default conf;
