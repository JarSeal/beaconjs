import fs from 'fs';
import { config } from 'dotenv';

config();

const createEnvFiles = () => {
  let S = '__'; // Default separator
  const allKeys = Object.keys(process.env);

  // Get config data
  let handles = [];
  let targets = {};

  const configFile = './.envconfig.json';
  let configFileContent;
  try {
    if (fs.existsSync(configFile)) {
      configFileContent = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    }
  } catch (err) {
    console.log(err);
    throw new Error(`Error while checking/reading config file (${configFile})`);
  }
  if (configFileContent.separator) {
    S = configFileContent.separator;
  }
  if (process.env.__ENV_CONFIG_SEPARATOR) {
    S = process.env.__ENV_CONFIG_SEPARATOR;
  }
  const configTargets = configFileContent.targets ? configFileContent.targets : {};

  const embeddedTargets = allKeys
    .filter((key) => key.includes(`${S}env_config_target`))
    .reduce((acc, key) => {
      const handle = key.split(S)[0];
      if (handle === 'sv') {
        throw new Error(
          'Handle "sv" is a reserved handle for shared values. Choose another handle.'
        );
      }
      acc[handle] = process.env[key];
      return acc;
    }, {});

  targets = { ...configTargets, ...embeddedTargets };
  handles = Object.keys(targets);

  // Create shared values object
  const sharedValuesObj = allKeys
    .filter((key) => key.includes(`sv${S}`))
    .reduce((acc, key) => {
      acc[key] = process.env[key];
      return acc;
    }, {});

  for (let i = 0; i < handles.length; i++) {
    const h = handles[i];

    const obj = allKeys
      .filter((key) => key.includes(`${h}${S}`) && key !== `${h}${S}env_config_target`)
      .map((key) => ({ [key.replace(`${h}${S}`, '')]: process.env[key] }));

    let envFileContent = autoGenerationMessage;
    obj.forEach((keyAndVal) => {
      for (let [key, value] of Object.entries(keyAndVal)) {
        if (value.includes(`sv${S}`) && sharedValuesObj[value]) {
          value = sharedValuesObj[value];
        }
        envFileContent += key + '=' + value + '\n';
      }
    });

    const target = targets[h];
    try {
      if (fs.existsSync(target)) {
        fs.unlinkSync(target);
      }
      fs.writeFileSync(target, envFileContent, { flag: 'w+' });
      console.log(`Created "${h}" .env file: ${target}`);
    } catch (err) {
      console.log(err);
    }
  }

  if (!handles.length) {
    console.log('No .env files were created.');
  }
};

const autoGenerationMessage =
  '# This is an auto-generated file.\n# Do not edit the contents of this file.\n# Only edit the root folder .env file.\n';

createEnvFiles();
