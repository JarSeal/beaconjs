import bbar from './bbar.html?raw';
import { _CONFIG } from '../../_ROUTES';
import MainMenu from './MainMenu';
import styles from './Bbar.module.scss';
import Component from '../../LIGHTER/Component';

class Bbar extends Component {
  constructor(data) {
    super(data);
    this.template = bbar;
    this._addToCSSClass(styles.bbar);

    this.appState = data.appState;

    this.mainMenu = this.addChild(new MainMenu({ id: 'main-menu', appState: data.appState }));
  }

  addListeners() {
    this.appState.set('resizers.bbar', this.onResize);
    this.onResize();
  }

  paint = () => {
    this.mainMenu.draw();
  };

  onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w > h) {
      this.elem.style.width = _CONFIG.bbarSize + 'px';
      this.elem.style.height = h + 'px';
    } else {
      this.elem.style.width = w + 'px';
      this.elem.style.height = _CONFIG.bbarSize + 'px';
    }
  };
}

export default Bbar;
