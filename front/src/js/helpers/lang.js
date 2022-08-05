import { assetsObj } from '../../lang/assets';
import { LocalStorage, SessionStorage, Logger } from '../LIGHTER';
import { frontConfig } from '../_CONFIG';

let assets,
  curLang,
  baseLang = 'en';
const logger = new Logger('Beacon lang *****');

export const loadAssets = () => {
  // Parse possible csv file here
  assets = assetsObj;
  getLang();
  return true;
};

export const setLang = (newLang) => {
  const LS = new LocalStorage(frontConfig.lsKeyPrefix);
  let success = LS.setItem('lang', newLang);
  if (!success) {
    const SS = new SessionStorage(frontConfig.ssKeyPrefix);
    success = SS.setItem('lang', newLang);
  }
  curLang = newLang;
};

export const getLang = () => {
  let lang;
  const LS = new LocalStorage(frontConfig.lsKeyPrefix);
  lang = LS.getItem('lang');
  if (!lang) {
    const SS = new SessionStorage(frontConfig.ssKeyPrefix);
    lang = SS.getItem('lang');
  }
  if (!lang) lang = curLang;
  if (!lang) lang = frontConfig.langs[0];
  if (!lang) lang = baseLang;
  curLang = lang;
  return lang;
};

export const getText = (id, replacers) => {
  let text = assets[id];
  if (!text) {
    logger.warn(`Text asset missing. id: ${id}, replacers: ${JSON.stringify(replacers)}`);
    return `[${id}]`;
  }
  text = text[curLang];
  if (!text) {
    logger.warn(
      `Text asset missing for lang: ${curLang}. id: ${id}, replacers: ${JSON.stringify(replacers)}`
    );
    return `[${id}]`;
  }
  if (replacers) {
    for (let i = 0; i < replacers.length; i++) {
      text = text.replace('$[' + i + ']', replacers[i]);
    }
  }
  return text;
};
