import axios from 'axios';
import { State, Component, Router } from './LIGHTER';
import Bbar from './components/bbar/Bbar';
import MainLoader from './components/loaders/MainLoader';
import { _CONFIG } from './_CONFIG';
import baseHTML from './base.html?raw';
import { loadAssets } from './helpers/lang';
import Dialog from './components/widgets/Dialog';
import Toaster from './components/widgets/Toaster';
import baseStyles from './Base.module.scss';
import { getApiBaseUrl } from './helpers/config';

class Base extends Component {
  constructor(data) {
    super(data);
    this.template = this._importHtml(baseHTML, [baseStyles]);
    this._addToCSSClass(baseStyles['base']);
    this.appState = this._initAppState();
    loadAssets();
    this._initResizer();
    _CONFIG.basePath = import.meta.env.VITE_CLIENT_PATH || '';
    this.Router = new Router(_CONFIG, this.id, this.paint, {
      appState: this.appState,
      attach: 'content-area',
    });
    this.bbar = this.addChild(new Bbar({ id: 'bbar', appState: this.appState }));
    this.mainLoader = this.addChild(new MainLoader({ id: 'main-loader', attach: 'overlays' }));
    this.dialog = this.addChild(
      new Dialog({ id: 'dialog', attach: 'overlays', appState: this.appState })
    );
    this.toaster = this.addChild(new Toaster({ id: 'toaster', attach: 'overlays' }));
    this.appState.set('Dialog', this.dialog);
    this.appState.set('Toaster', this.toaster);
    this.loadData();
  }

  addListeners() {
    this.appState.set('resizers.base', this.onResize);
    this.onResize();
  }

  init = () => {
    this.toaster.draw();
  };

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
    const url = getApiBaseUrl() + '/login/access';
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

  onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const elem = this.elem;
    if (w > h) {
      elem.classList.add('landscape');
      elem.classList.remove('portrait');
      elem.style.marginTop = 0;
      elem.style.marginLeft = _CONFIG.bbarSize + 'px';
      this.appState.set('orientationLand', true);
    } else {
      elem.classList.remove('landscape');
      elem.classList.add('portrait');
      elem.style.marginTop = _CONFIG.bbarSize + 'px';
      elem.style.marginLeft = 0;
      this.appState.set('orientationLand', false);
    }
  };
}

export default Base;
