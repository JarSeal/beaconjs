import http from 'http';

import app from './app.js';
import config from './utils/config.js';
import logger from './utils/logger.js';

const server = http.createServer(app);

server.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}, oh yeah!`);
  logger.info(
    `VARIBALOS: ${config.ENV}, ${config.CLIENT_URL}, ${config.CLIENT_PORT}, ${config.API_URL}, ${config.PORT}`
  );
});
