import mongoose from 'mongoose';

import config from '../utils/config.js';
import AdminSetting from '../models/adminSetting.js';
import { isValidObjectId, createNewEditedArray, createNewLoginLogsArray } from './helpers.js';
import { getSettings } from './settingsService.js';

const ObjectId = mongoose.Types.ObjectId;

beforeAll(() => {
  // Clears the database and adds some testing data.
  // Jest will wait for this promise to resolve before running tests.
  return mongoose
    .connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    })
    .then(() => {
      console.log(`\n\nconnected to MongoDB (${config.MONGODB_URI})`);
    })
    .catch((error) => {
      console.error('\n\nerror connection to MongoDB:', error.message, '\n\n');
    });
});

describe('helpers', () => {
  it('should check if a given id is a valid Mongo ObjectId or not', () => {
    const validId = '6293f65e9be6aa0e604218e3';
    const invalidId = 'hjui89';
    expect(isValidObjectId(validId)).toEqual(true);
    expect(isValidObjectId(ObjectId().toString())).toEqual(true);
    expect(isValidObjectId(invalidId)).toEqual(false);
    expect(isValidObjectId(null)).toEqual(false);
  });

  it('should create a new edited array', async () => {
    let editedArray = [
      {
        by: '6293f65e9be6aa0e604218e3',
        date: '2022-05-30T10:06:56.163Z',
      },
      {
        by: '6293f65e9be6aa0e604218e3',
        date: '2022-05-30T10:07:38.395Z',
      },
      {
        by: '6293f65e9be6aa0e604218e3',
        date: '2022-05-30T10:08:47.279Z',
      },
    ];
    const maxLogs = 5;
    await AdminSetting.findOneAndUpdate(
      { settingId: 'max-edited-logs' },
      { value: String(maxLogs) }
    );
    await getSettings(null); // Reload all settings to memory
    editedArray = await createNewEditedArray(editedArray, '6293f65e9be6aa0e604218e3');
    expect(editedArray.length).toEqual(4);
    const oldArray = [...editedArray];
    editedArray = await createNewEditedArray(editedArray, '6293f65e9be6aa0e604218e3');
    expect(editedArray.length).toEqual(5);
    expect(editedArray).toEqual([...oldArray, editedArray[4]]);
    expect(editedArray[4].by.toString().length).toEqual(24); // ObjectId
    expect(editedArray[4].date.toString().length).toEqual(62); // Date
    editedArray = await createNewEditedArray(editedArray, '6293f65e9be6aa0e604218e3');
    editedArray = await createNewEditedArray(editedArray, '6293f65e9be6aa0e604218e3');
    expect(editedArray.length).toEqual(maxLogs);
  });

  it('should create a new login logs array', async () => {
    let loginsArray = [
      {
        date: '2022-05-29T22:40:57.474Z',
        browserId: 'e48b1d1fd115319efcbc8ed3e0c205f9',
      },
      {
        date: '2022-05-29T22:42:57.474Z',
        browserId: 'e48b1d1fd115319efcbc8ed3e0c205f9',
      },
      {
        date: '2022-05-29T22:45:57.474Z',
        browserId: 'e48b1d1fd115319efcbc8ed3e0c205f9',
      },
    ];
    const maxLogs = 5;
    await AdminSetting.findOneAndUpdate(
      { settingId: 'max-login-logs' },
      { value: String(maxLogs) }
    );
    await getSettings(null); // Reload all settings to memory
    loginsArray = await createNewLoginLogsArray(loginsArray, {
      date: new Date(),
      browserId: 'e48b1d1fd115319efcbc8ed3e0c205f9',
    });
    expect(loginsArray.length).toEqual(4);
    const newLogin = {
      date: new Date(),
      browserId: 'e48b1d1fd115319efcbc8ed3e0c205f9',
    };
    const oldArray = [...loginsArray];
    loginsArray = await createNewLoginLogsArray(loginsArray, newLogin);
    expect(loginsArray.length).toEqual(5);
    expect(loginsArray).toEqual([...oldArray, newLogin]);
    expect(loginsArray[4].date.toString().length).toEqual(62); // Date
    expect(loginsArray[4].browserId.length).toEqual(32); // BrowserId
    loginsArray = await createNewLoginLogsArray(loginsArray, {
      date: new Date(),
      browserId: 'e48b1d1fd115319efcbc8ed3e0c205f9',
    });
    loginsArray = await createNewLoginLogsArray(loginsArray, {
      date: new Date(),
      browserId: 'e48b1d1fd115319efcbc8ed3e0c205f9',
    });
    expect(loginsArray.length).toEqual(maxLogs);
  });
});
