import shared from './shared/index.js';

const conf = shared.CONFIG.UI;

const _conf = {
  lsKeyPrefix: 'bjs_',
  ssKeyPrefix: 'bjs_',
};

export const frontConfig = Object.assign({}, _conf, conf);
