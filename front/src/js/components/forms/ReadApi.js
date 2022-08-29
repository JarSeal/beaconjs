import axios from 'axios';
import { getApiBaseUrl } from '../../helpers/config';
import { Logger } from '../../LIGHTER';

// Attributes
// - url: String
// - onError: Function
// - afterGet: Function
class ReadApi {
  constructor(params) {
    if (!params || !params.url) {
      Logger.error('ReadApi is missing params. At least url is needed.');
      return;
    }
    this.url = getApiBaseUrl() + params.url;
    this.onError = params.onError;
    this.afterGet = params.afterGet;
  }

  getData = async (queryParams) => {
    try {
      let query = '';
      if (queryParams) {
        if (typeof queryParams === 'string' || queryParams instanceof String) {
          query = queryParams;
        } else if (typeof queryParams === 'object' && !Array.isArray(queryParams)) {
          const keys = Object.keys(queryParams);
          const queryA = [];
          for (let i = 0; i < keys.length; i++) {
            queryA.push(keys[i] + '=' + queryParams[keys[i]]);
          }
          query = queryA.join('&');
        } else {
          Logger.error(
            'ReadApi getData queryParams must be either a string, an object, or undefined.'
          );
          throw new Error('Call stack');
        }
      }
      const url = query ? this.url + '?' + query : this.url;
      const result = await axios.get(url, { withCredentials: true });
      if (result.data) {
        if (this.afterGet) this.afterGet(result.data);
        return result.data;
      }
    } catch (e) {
      if (this.onError) this.onError(e);
      let redirectToLogin = false;
      if (e.response && e.response.data && e.response.data.loggedIn === false)
        redirectToLogin = true;
      return {
        error: true,
        exception: e,
        redirectToLogin,
      };
    }
  };
}

export default ReadApi;
