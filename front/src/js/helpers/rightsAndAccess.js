import axios from 'axios';
import { Logger } from '../LIGHTER';
import { getApiBaseUrl } from './config';

const checkRouteAccess = async (routeData) => {
  if (!routeData || !routeData.route) {
    const logger = new Logger('checkRouteAccess: *****');
    logger.error('Could not check route access, routeData or routeData.route missing.');
    throw new Error('Call stack');
  }
  const id = routeData.route.id;
  const appState = routeData.commonData.appState;
  const routeAccess = appState.get('serviceSettings._routeAccess');
  if (routeAccess) {
    if (routeAccess[id] === false) {
      return '/login';
    }
  } else {
    const url = getApiBaseUrl() + '/login/access';
    const payload = {
      ids: [
        {
          from: 'form',
          id,
        },
      ],
    };
    try {
      const response = await axios.post(url, payload, { withCredentials: true });
      const access = response.data[id];
      if (!access) {
        if (!response.data.loggedIn) {
          const redirectRoute = '?r=' + routeData.curRoute.replace(routeData.basePath, '');
          return '/logout' + redirectRoute;
        }
        return '/login';
      }
    } catch (exception) {
      const logger = new Logger('checkRouteAccess: *****');
      logger.error('Could not check route access', exception);
      throw new Error('Call stack');
    }
  }
};

const getAdminRights = async () => {
  const url = getApiBaseUrl() + '/login/access';
  const payload = { from: 'admin' };
  try {
    const response = await axios.post(url, payload, { withCredentials: true });
    const access = response.data;
    return access;
  } catch (exception) {
    const logger = new Logger('getAdminRights: *****');
    logger.error('Could not get admin rights', exception);
    throw new Error('Call stack');
  }
};

export { checkRouteAccess, getAdminRights };
