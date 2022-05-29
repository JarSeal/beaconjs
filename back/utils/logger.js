const info = (...params) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(...params);
  }
};

const log = (...params) => {
  console.log(...params);
};

const error = (...params) => {
  console.error(...params);
};

const logger = {
  info,
  error,
  log,
};

export default logger;
