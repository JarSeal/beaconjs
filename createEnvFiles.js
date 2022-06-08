import fs from 'fs';
import { config } from 'dotenv';

const FRONT_TARGET = './front/src/.env';
const BACK_TARGET = './back/.env';

config();

const createEnvFiles = () => {
  // Create env objects
  const allKeys = Object.keys(process.env);
  const frontObj = allKeys
    .filter((key) => key.includes('front__', ''))
    .map((key) => ({ [key.replace('front__', '')]: process.env[key] }));
  const backObj = allKeys
    .filter((key) => key.includes('back__', ''))
    .map((key) => ({ [key.replace('back__', '')]: process.env[key] }));

  // Create file contents
  let frontEnvContent = autoGenerationMessage;
  frontObj.forEach((keyAndVal) => {
    for (const [key, value] of Object.entries(keyAndVal)) {
      frontEnvContent += key + '=' + value + '\n';
    }
  });
  let backEnvContent = autoGenerationMessage;
  backObj.forEach((keyAndVal) => {
    for (const [key, value] of Object.entries(keyAndVal)) {
      backEnvContent += key + '=' + value + '\n';
    }
  });

  // Create files
  try {
    if (fs.existsSync(FRONT_TARGET)) {
      fs.unlinkSync(FRONT_TARGET);
    }
    fs.writeFileSync(FRONT_TARGET, frontEnvContent, { flag: 'w+' });
    console.log('Created frontend .env file: ' + FRONT_TARGET);
  } catch (err) {
    console.log(err);
  }
  try {
    if (fs.existsSync(BACK_TARGET)) {
      fs.unlinkSync(BACK_TARGET);
    }
    fs.writeFileSync(BACK_TARGET, backEnvContent, { flag: 'w+' });
    console.log('Created backend .env file: ' + BACK_TARGET);
  } catch (err) {
    console.log(err);
  }
};

const autoGenerationMessage =
  '# This is an auto-generated file.\n# Do not edit the contents of this file.\n# Only edit the root folder .env file.\n';

createEnvFiles();
