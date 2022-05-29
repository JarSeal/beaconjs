import axios from 'axios';
import { State, Component, Router } from './LIGHTER';
import Bbar from './components/bbar/Bbar';
import MainLoader from './components/loaders/MainLoader';
import { _CONFIG } from './_CONFIG';
import baseHTML from './base.html?raw';
import './Base.scss';
import { loadAssets } from './helpers/lang';
import Dialog from './components/widgets/Dialog';
import './components/widgets/Dialog.scss';

class Base extends Component {
  constructor(data) {
    super(data);
    this.template = baseHTML;
    this.appState = this._initAppState();
    loadAssets();
    this._initResizer();
    this.Router = new Router(_CONFIG, this.id, this.paint, {
      appState: this.appState,
      attach: 'content-area',
    });
    this.bbar = this.addChild(new Bbar({ id: 'bbar', appState: this.appState }));
    this.mainLoader = this.addChild(new MainLoader({ id: 'main-loader', attach: 'overlays' }));
    this.dialog = this.addChild(
      new Dialog({ id: 'dialog', attach: 'overlays', appState: this.appState })
    );
    this.appState.set('Dialog', this.dialog);
    this.loadData();
  }

  paint = () => {
    this.dialog.disappear();
    if (this.appState.get('loading.main')) {
      if (this.mainLoader) this.mainLoader.draw();
    } else {
      if (this.mainLoader) this.mainLoader.discard(true);
      this.mainLoader = null;
      this.bbar.draw();
      this.Router.draw();
    }
  };

  _initAppState = () => {
    // Init appState
    const state = new State({
      loading: { main: null },
      resizers: {},
      orientationLand: true,
      curRoute: '/',
      browserId: this.data.browserId,
      user: {
        loggedIn: false,
        username: null,
        userLevel: 0,
      },
      Dialog: null,
    });
    state.set('loading.main', true, this.paint);
    return state;
  };

  loadData = async () => {
    const browserId = this.appState.get('browserId');
    const url = _CONFIG.apiBaseUrl + '/api/login/access';
    const payload = { from: 'checklogin', browserId };
    const response = await axios.post(url, payload, { withCredentials: true });

    if (response && response.data && response.data.loggedIn) {
      this.appState.set('user.username', response.data.username);
      this.appState.set('user.loggedIn', response.data.loggedIn);
      this.appState.set('user.userLevel', response.data.userLevel || 0);
      this.appState.set('user.verified', response.data.accountVerified);
    }
    this.appState.set('serviceSettings', response.data.serviceSettings);

    this.mainLoader.hide(() => {
      this.appState.set('loading.main', false);
    });
  };

  _initResizer = () => {
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const resizers = this.appState.get('resizers');
        const keys = Object.keys(resizers);
        for (let i = 0; i < keys.length; i++) {
          resizers[keys[i]]();
        }
      }, 0);
    });
  };
}

export default Base;
