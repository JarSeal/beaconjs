import shared from '../../../shared';

const conf = shared.CONFIG;

const optionsFns = {
  userLevels: (args) => {
    if (!args || args.readerLevel === undefined || isNaN(args.readerLevel)) {
      return [];
    }
    let { readerLevel } = args;
    const levels = conf.USER_LEVELS;
    const options = [];
    for (let i = 0; i < levels.length; i++) {
      const uLevel = levels[i];
      if (uLevel.userLevel === 0 || uLevel.userLevel >= readerLevel) continue;
      options.push({
        value: uLevel.userLevel,
        labelId: uLevel.labelId,
      });
    }
    return options;
  },
  userLevelsWithNine: (args) => {
    if (!args || args.readerLevel === undefined || isNaN(args.readerLevel)) {
      return [];
    }
    let { readerLevel } = args;
    const levels = conf.USER_LEVELS;
    const options = [];
    for (let i = 0; i < levels.length; i++) {
      const uLevel = levels[i];
      if (uLevel.userLevel === 0 || uLevel.userLevel > readerLevel) continue;
      options.push({
        value: uLevel.userLevel,
        labelId: uLevel.labelId,
      });
    }
    return options;
  },
};

export default optionsFns;
