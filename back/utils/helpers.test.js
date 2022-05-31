import mongoose from 'mongoose';

import config from '../utils/config.js';
import AdminSetting from '../models/adminSetting.js';
import User from '../models/user.js';
import {
  isValidObjectId,
  createNewEditedArray,
  createNewLoginLogsArray,
  checkIfEmailTaken,
} from './helpers.js';
import { getSettings } from './settingsService.js';

const ObjectId = mongoose.Types.ObjectId;

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

  it('should check if an email exists or not', async () => {
    const user1 = new User({
      username: 'UserNr1',
      email: 'first.last@somedomain.org',
      name: '',
      userLevel: 2,
      passwordHash: 'ijiojfewjoifdjdfo',
      created: {
        by: new ObjectId(),
        publicForm: true,
        date: new Date(),
      },
      security: {
        token: null,
        oldEmail: null,
        verified: true,
      },
    });
    const user2 = new User({
      username: 'UserNr2',
      email: 'some.otheremail@somedomain.org',
      name: '',
      userLevel: 2,
      passwordHash: 'ijiojfewjoifdjdfo',
      created: {
        by: new ObjectId(),
        publicForm: true,
        date: new Date(),
      },
      security: {
        verifyEmail: {
          token: 'sometoken',
          oldEmail: 'some.email@somedomain.org',
          verified: true,
        },
      },
    });
    const savedUser1 = await user1.save();
    const savedUser2 = await user2.save();
    const check1 = await checkIfEmailTaken('first.last@somedomain.org', savedUser2._id);
    const check2 = await checkIfEmailTaken('   some.otheremail@somedomain.org ', savedUser1._id);
    const check3 = await checkIfEmailTaken('some.email@somedomain.org', savedUser1._id);
    const check4 = await checkIfEmailTaken('some.email@somedomain.org', savedUser2._id);
    expect(check1).toEqual(true);
    expect(check2).toEqual(true);
    expect(check3).toEqual(true);
    expect(check4).toEqual(false);
  });
});
