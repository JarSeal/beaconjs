export const getApiBaseUrl = () => {
  const ENV = import.meta.env;
  const PORT = ENV.VITE_API_PORT === '80' ? '' : ':' + ENV.VITE_API_PORT;
  return `${ENV.VITE_API_BASE_URL}${PORT}${ENV.VITE_API_BASE_PATH}`;
};

export const getClientBaseUrl = () => {
  const ENV = import.meta.env;
  const PORT = ENV.VITE_CLIENT_PORT === '80' ? '' : ':' + ENV.VITE_CLIENT_PORT;
  return `${ENV.VITE_CLIENT_URL}${PORT}`;
};
