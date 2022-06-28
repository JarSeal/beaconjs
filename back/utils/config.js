import { config } from 'dotenv';

config();

const ENV = process.env.NODE_ENV || 'production';

const API_URL = process.env.API_BASE_URL;
const API_PATH = process.env.API_BASE_PATH;
let PORT = process.env.API_PORT || 3000;
if (ENV === 'test') PORT = process.env.API_PORT_TEST || 3004;

const CLIENT_URL = process.env.CLIENT_BASE_URL;
const CLIENT_PATH = process.env.CLIENT_BASE_PATH;
const CLIENT_PORT = process.env.CLIENT_PORT || 80;

let MONGODB_URI = process.env.MONGODB_URI;
if (ENV === 'test') {
  MONGODB_URI = process.env.TEST_MONGODB_URI;
}

const SECRET = process.env.SECRET;
const FORM_TOKEN_SECRET = process.env.FORM_TOKEN_SECRET;

const v = (v) => {
  return v === undefined || v === null || v.length === 0;
};

if (v(API_URL) || v(CLIENT_URL) || v(SECRET) || v(FORM_TOKEN_SECRET)) {
  throw new Error(
    'Missing required .env variables (API_URL, CLIENT_URL, SECRET, FORM_TOKEN_SECRET).'
  );
}

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const getApiBaseUrl = (givenBaseUrl) => {
  if (!givenBaseUrl) givenBaseUrl = API_URL;
  return `${givenBaseUrl}:${PORT}${API_PATH}`;
};

const getClientBaseUrl = (givenBaseUrl) => {
  if (!givenBaseUrl) givenBaseUrl = CLIENT_URL;
  return `${givenBaseUrl}:${CLIENT_PORT}${CLIENT_PATH}`;
};

const conf = {
  ENV,
  MONGODB_URI,
  API_URL,
  API_PATH,
  PORT,
  CLIENT_URL,
  CLIENT_PATH,
  CLIENT_PORT,
  EMAIL_HOST,
  EMAIL_USER,
  EMAIL_PASS,
  SECRET,
  getApiBaseUrl,
  getClientBaseUrl,
};

export default conf;
