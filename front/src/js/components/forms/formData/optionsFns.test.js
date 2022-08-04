import optionsFns from './optionsFns';

describe('optionsFns', () => {
  it('should create drop down options according to readerLevel', async () => {
    let userLevels = optionsFns.userLevels();
    expect(userLevels).toHaveLength(0);
    userLevels = optionsFns.userLevels({ readerLevel: 'some text' });
    expect(userLevels).toHaveLength(0);
    userLevels = optionsFns.userLevels({ readerLevel: 0 });
    expect(userLevels).toHaveLength(0);
    userLevels = optionsFns.userLevels({ readerLevel: 1 });
    expect(userLevels).toHaveLength(0);
    userLevels = optionsFns.userLevels({ readerLevel: 2 });
    expect(userLevels).toHaveLength(1);
    userLevels = optionsFns.userLevels({ readerLevel: 9 });
    expect(userLevels.length > 1).toBeTruthy();
    expect(typeof userLevels[0].value).toBe('number');
    expect(typeof userLevels[0].labelId).toBe('string');
  });

  it('should create drop down options according to readerLevel with level 9', async () => {
    let userLevels = optionsFns.userLevelsWithNine();
    expect(userLevels).toHaveLength(0);
    userLevels = optionsFns.userLevelsWithNine({ readerLevel: 'some text' });
    expect(userLevels).toHaveLength(0);
    userLevels = optionsFns.userLevelsWithNine({ readerLevel: 0 });
    expect(userLevels).toHaveLength(0);
    userLevels = optionsFns.userLevelsWithNine({ readerLevel: 1 });
    expect(userLevels).toHaveLength(1);
    userLevels = optionsFns.userLevelsWithNine({ readerLevel: 2 });
    expect(userLevels.length > 1).toBeTruthy();
    userLevels = optionsFns.userLevelsWithNine({ readerLevel: 9 });
    expect(userLevels.length > 1).toBeTruthy();
    expect(typeof userLevels[0].value).toBe('number');
    expect(typeof userLevels[0].labelId).toBe('string');
  });
});
