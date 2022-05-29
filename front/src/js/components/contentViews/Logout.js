import axios from 'axios';
import { Component } from '../../LIGHTER';
import { _CONFIG } from '../../_CONFIG';

class Logout extends Component {
  constructor(data) {
    // Technically not a view, but it is a route
    super(data);
    this.appState = data.appState;
  }

  init = (data) => {
    this.logOut(data.appState);
  };

  logOut = async (appState) => {
    appState.set('user.loggedIn', false);
    appState.set('user.username', null);

    let url = _CONFIG.apiBaseUrl + '/api/login/access';
    let payload = { from: 'logout' };
    await axios.post(url, payload, { withCredentials: true });

    const browserId = this.appState.get('browserId');
    url = _CONFIG.apiBaseUrl + '/api/login/access';
    payload = { from: 'checklogin', browserId };
    const response = await axios.post(url, payload, { withCredentials: true });
    appState.set('serviceSettings', response.data.serviceSettings);

    let nextRoute = '/login';
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('r');
    if (redirect && redirect.length) nextRoute += '?r=' + redirect;
    this.Router.changeRoute(nextRoute);
  };
}

export default Logout;
