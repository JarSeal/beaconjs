export const validateEmail = (email) => {
  const regex =
    // eslint-disable-next-line
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return regex.test(email);
};

export const validateSimpleId = (id) => {
  const regex = /^[a-zA-Z0-9-_]+$/;
  return regex.test(id);
};

export const urlParamRoute = (route, recover) => {
  if (!recover) return route.replace(/\//g, '**');
  // eslint-disable-next-line
  return route.replace(/**/g, '/');
};

export const createRandomString = (length, charsOrPreset) => {
  let result = '',
    characters = '';
  if (typeof charsOrPreset === 'boolean' || charsOrPreset === undefined) {
    // charsOrPreset is a Boolean or undefined
    const charactersSimple = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersComplex = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!$&%€';
    characters = charsOrPreset ? charactersSimple : charactersComplex;
  } else {
    // charsOrPreset is a string of characters to be used
    characters = charsOrPreset;
  }
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export const thisLine = () => {
  const e = new Error();
  const curCallerFileAndPos = e.stack.split('\n')[2].replace('at ');
  return curCallerFileAndPos;
};

const parsers = { validateEmail, validateSimpleId, urlParamRoute, createRandomString, thisLine };

export default parsers;
