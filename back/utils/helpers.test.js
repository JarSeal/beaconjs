import mongoose from 'mongoose';

import { isValidObjectId } from './helpers.js';

const ObjectId = mongoose.Types.ObjectId;

describe('helpers', () => {
  it('should check if a given id is a valid Mongo ObjectId or not', () => {
    const validId = '6293f65e9be6aa0e604218e3';
    const invalidId = 'hjui89';
    expect(isValidObjectId(validId)).toEqual(true);
    expect(isValidObjectId(ObjectId().toString())).toEqual(true);
    expect(isValidObjectId(invalidId)).toEqual(false);
    expect(isValidObjectId(null)).toEqual(false);
  });
});
