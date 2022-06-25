export const getApiBaseUrl = () => {
  const ENV = import.meta.env;
  return `${ENV.VITE_API_BASE_URL}:${ENV.VITE_API_PORT}${ENV.VITE_API_BASE_PATH}`;
};

export const getClientBaseUrl = () => {
  const ENV = import.meta.env;
  return `${ENV.VITE_CLIENT_URL}:${ENV.VITE_CLIENT_PORT}`;
};
