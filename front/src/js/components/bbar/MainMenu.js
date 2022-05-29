import Component from '../../LIGHTER/Component';
import RouteLink from '../buttons/RouteLink';
import Button from '../buttons/Button';
import './MainMenu.scss';

class MainMenu extends Component {
  constructor(data) {
    super(data);
    this.appState = data.appState;
    this.switchTime = 300; // milliseconds
    this.nudgeTimer;
    this.drawTimer;
    this.backButtonPressed = false;
    this.template =
      '<div class="main-menu">' +
      `<div id="nav-menu" style="transition-duration:${this.switchTime}ms"></div>` +
      `<div id="tool-menu" class="show-tool-menu" style="transition-duration:${this.switchTime}ms"></div>` +
      '<div id="sticky-menu"></div>' +
      '</div>';

    this.homeButton = this.addChild(
      new RouteLink({
        id: 'home-button',
        class: 'home-button',
        link: '/',
        attach: 'nav-menu',
        text: 'Home',
      })
    );
    this.settingsButton = this.addChild(
      new RouteLink({
        id: 'settings-button',
        link: '/settings',
        attach: 'sticky-menu',
        text: 'Settings',
      })
    );
    this.logoutButton = this.addChild(
      new RouteLink({
        id: 'logout-button',
        link: '/logout',
        attach: 'sticky-menu',
        text: 'Logout',
      })
    );
    this.backButton = this.addChild(
      new Button({
        id: 'main-back-button',
        class: 'main-back-button',
        html: '&#x2190;',
        attach: 'nav-menu',
        click: this._goBack,
      })
    );

    this.menuState = {
      backButton: false,
      toolsMenu: [],
      newMenuState: [],
    };

    this.appState.set('updateMainMenu', this.updateMainMenu);
  }

  // This gets called everytime the view changes
  paint = () => {
    this.homeButton.draw();
    this._hideTools();
    this._drawStickyMenu();
  };

  _hideTools = () => {
    this._drawOldTools();
    const toolMenuElem = this.elem.querySelector('#tool-menu');
    const navMenuElem = this.elem.querySelector('#nav-menu');
    if (this.menuState.backButton) navMenuElem.classList.add('show-back-button');
    clearTimeout(this.nudgeTimer);
    clearTimeout(this.drawTimer);
    this.nudgeTimer = setTimeout(() => {
      navMenuElem.classList.remove('show-back-button');
      toolMenuElem.classList.remove('show-tool-menu');
    }, 20);
    this.drawTimer = setTimeout(() => {
      const tools = this.menuState.toolsMenu;
      for (let i = 0; i < tools.length; i++) {
        this.discardChild(tools[i].id);
      }
      let newTools = [];
      if (this.menuState.newMenuState && this.menuState.newMenuState.tools) {
        newTools = [...this.menuState.newMenuState.tools];
        this.menuState.newMenuState.tools = [];
      }
      this._drawTools(newTools, toolMenuElem);
      this._checkBackButton(navMenuElem);
    }, this.switchTime + 100);
  };

  _drawOldTools = () => {
    this.backButton.draw();
    for (let i = 0; i < this.menuState.toolsMenu.length; i++) {
      const id = this.menuState.toolsMenu[i].id;
      if (this.children[id]) this.children[id].draw();
    }
  };

  _drawTools = (newTools, toolMenuElem) => {
    for (let i = 0; i < newTools.length; i++) {
      const tool = newTools[i];
      tool.attach = 'tool-menu';
      const comp = this.addChild(new Button(tool));
      this.menuState.toolsMenu.push(comp);
      comp.draw();
    }
    toolMenuElem.classList.add('show-tool-menu');
  };

  _drawStickyMenu = () => {
    if (this.appState.get('user.loggedIn')) {
      this.settingsButton.draw();
      this.logoutButton.draw();
    }
  };

  _checkBackButton = (navMenuElem) => {
    const curHistoryState = this.Router.getCurHistoryState();
    if (!this.Router.prevRoute && curHistoryState.backButton === undefined) {
      const referrer = document.referrer.split('/');
      let refHostname = '';
      if (referrer.length > 2) refHostname = referrer[2].split(':')[0];
      if (refHostname != location.hostname) {
        this.menuState.newMenuState.backButton = false;
      }
      this.Router.setCurHistoryState({ backButton: this.menuState.newMenuState.backButton });
    }
    if (curHistoryState.backButton !== undefined) {
      this.menuState.newMenuState.backButton = curHistoryState.backButton;
    }

    if (this.menuState.newMenuState.backButton) {
      // Show backButton
      navMenuElem.classList.add('show-back-button');
      this.menuState.newMenuState.backButton = false;
      this.menuState.backButton = true;
      this.backButtonPressed = false;
    } else {
      // Hide backButton
      navMenuElem.classList.remove('show-back-button');
      this.menuState.backButton = false;
    }
    this.Router.setCurHistoryState({ backButton: this.menuState.backButton });
  };

  _goBack = () => {
    if (this.backButtonPressed || !this.menuState.backButton) return;
    this.backButtonPressed = true;
    window.history.back();
  };

  // newMenuState: Object
  // - backButton: Boolean
  // - tools: [{component data for Button}]
  updateMainMenu = (newMenuState) => {
    this.menuState.newMenuState = newMenuState;
    if (newMenuState.backButton) {
      this.backButton.discard(true);
      this.backButton = this.addChild(
        new Button({
          id: 'main-back-button',
          class: 'main-back-button',
          html: '&#x2190;',
          attach: 'nav-menu',
          click: this._goBack,
        })
      );
      this.backButton.draw();
    }
  };
}

export default MainMenu;
