import { Component, Logger } from '../../LIGHTER';
import ReadApi from '../forms/ReadApi';
import { getText } from '../../helpers/lang';
import { createDate } from '../../helpers/date';
import './OneUser.scss';
import FourOOne from './FourOOne';
import FourOFour from './FourOFour';
import ViewTitle from './../widgets/ViewTitle';
import DialogForms from './../widgets/dialogs/dialog_Forms';
import Logs from './Logs';

class OneUser extends Component {
  constructor(data) {
    super(data);
    this.template = '<div class="one-user">' + '<div id="back-button-holder"></div>' + '</div>';
    this.viewTitle = this.addChild(
      new ViewTitle({
        id: this.id + '-view-title',
        heading: getText('user'),
        spinner: true,
      })
    );
    this.userId;
    this.userData;
    this.appState = this.Router.commonData.appState;
    this.readApi;
    this.dialogForms = new DialogForms({ id: 'dialog-forms-one-user' });
  }

  init = () => {
    this.userId = this.Router.getRouteParams().user;
    this.readApi = new ReadApi({ url: '/api/users/' + this.userId });
    this.viewTitle.draw();
    this._loadUserData();
  };

  _loadUserData = async () => {
    this.userData = null;
    this.viewTitle.showSpinner(true);

    this.userData = await this.readApi.getData();
    this.viewTitle.showSpinner(false);
    if (this.userData.redirectToLogin) {
      this.Router.changeRoute('/logout?r=' + this.Router.getRoute(true));
      return;
    }
    if (this.userData.error) {
      this.addChildDraw({
        id: 'error-getting-one-user',
        template: `<div class="error-text">${getText('could_not_get_data')}</div>`,
      });
    }

    // Check if the viewer and the user to view are the same, if yes, redirect to my profile
    if (this.userData.username === this.appState.get('user.username')) {
      this.Router.changeRoute('/settings/my-profile', { replaceState: true });
      return;
    }

    if (this.userData.error && this.userData.exception) {
      const exception = this.userData.exception;
      const status = exception.response.status;
      this.appState.get('updateMainMenu')({ tools: [] });
      if (status === 401) {
        this.addChildDraw(new FourOOne({ id: 'one-user-401' }));
      } else if (status === 404) {
        this.addChildDraw(
          new FourOFour({
            id: 'one-user-404',
            bodyText: getText('user_not_found'),
          })
        );
      } else {
        this.addChildDraw({
          id: 'one-user-bigerror',
          template: `<div><h2>${getText('error')}</h2></div>`,
        });
        const logger = new Logger('Get one user: *****');
        logger.error('Could not get users data', exception.response);
        throw new Error('Call stack');
      }
      return;
    }

    this._createTools();
    this._createElements();
  };

  _createElements = () => {
    const contentDefinition = [
      { id: 'username', tag: 'h1', label: getText('username') },
      { id: 'name', label: getText('name') },
      { id: 'email', label: getText('email') },
      { id: 'id', label: 'ID' },
      { id: 'userLevel', label: getText('user_level') },
      { id: 'created', label: getText('created') },
      { id: 'edited', label: getText('last_edited') },
      // { id: 'userGroups', label: getText('user_groups') },
    ];
    for (let i = 0; i < contentDefinition.length; i++) {
      const item = contentDefinition[i];
      const id = item.id;
      let value,
        verificationStatus = '';
      let tag = 'div';
      if (item.tag) tag = item.tag;

      if (this.userData[id] === undefined) {
        continue;
      } else if (id === 'created') {
        value = createDate(this.userData[id].date);
      } else if (id === 'edited' && this.userData[id][0]) {
        const lastIndex = this.userData[id].length - 1;
        value = createDate(this.userData[id][lastIndex].date);
      } else if (id === 'userLevel') {
        if (id === 'userLevel') value = getText('user_level_' + this.userData[id]);
      } else if (id === 'email' && this.appState.get('serviceSettings.useEmailVerification')) {
        value = this.userData[id];
        const isVerified =
          this.userData.security &&
          this.userData.security.verifyEmail &&
          this.userData.security.verifyEmail.verified;
        verificationStatus = isVerified
          ? `&nbsp;&nbsp;&nbsp;&nbsp;(${getText('verified')})`
          : `&nbsp;&nbsp;&nbsp;&nbsp;(${getText('unverified')})`;
      } else {
        value = this.userData[id];
      }
      if (!value.length) value = '&nbsp;';
      this.addChildDraw({
        id: 'user-data-' + id,
        template:
          '<div class="user-data-item">' +
          `<span class="user-data-item__label">
                        ${item.label}
                        <span class="user-data-item__label--smaller">${verificationStatus}</span>
                    </span>` +
          `<${tag} class="user-data-item__value">${value}</${tag}>` +
          '</div>',
      });
    }
  };

  _createTools = () => {
    let tools = null;
    const loggedIn = this.appState.get('user').loggedIn;
    const updateMainMenu = this.appState.get('updateMainMenu');
    if (loggedIn && this.userData.id) {
      // If the userData.id is present, then the current user has admin rights
      const Dialog = this.Router.commonData.appState.get('Dialog');
      tools = [
        {
          id: 'edit-user-tool',
          type: 'button',
          text: getText('edit'),
          click: () => {
            if (!this.userData) return;
            this.dialogForms.createEditDialog({
              id: 'edit-user-form',
              title: getText('edit_user') + ': ' + this.userData.username,
              editDataId: this.userData.id,
              addToMessage: { userId: this.userData.id },
              afterFormSentFn: () => {
                this._loadUserData();
              },
              onErrorFn: () => {
                this._loadUserData();
              },
            });
          },
        },
        {
          id: 'user-exposure-tool',
          type: 'button',
          text: getText('exposure'),
          click: () => {
            if (!this.userData) return;
            this.dialogForms.createEditDialog({
              id: 'edit-expose-profile-form',
              title: getText('profile_exposure') + ': ' + this.userData.username,
              editDataId: this.userData.id,
              addToMessage: { userId: this.userData.id },
              afterFormSentFn: () => {
                this._loadUserData();
              },
              onErrorFn: () => {
                this._loadUserData();
              },
            });
          },
        },
        {
          id: 'user-logs-tool',
          type: 'button',
          text: getText('logs'),
          click: () => {
            if (!this.userData) return;
            Dialog.appear({
              component: Logs,
              componentData: {
                id: 'user-logs-dialog',
                userData: this.userData,
              },
            });
          },
        },
      ];
    }
    updateMainMenu({
      backButton: true,
      tools,
    });
  };
}

export default OneUser;
