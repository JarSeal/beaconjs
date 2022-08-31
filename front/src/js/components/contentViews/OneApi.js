import { Component, Logger } from '../../LIGHTER';
import ReadApi from '../forms/ReadApi';
import { getText } from '../../helpers/lang';
import { createDate } from '../../helpers/date';
import styles from './OneApi.module.scss';
import FourOOne from './FourOOne';
import FourOFour from './FourOFour';
import ViewTitle from './../widgets/ViewTitle';
import DialogForms from './../widgets/dialogs/dialog_Forms';

class OneApi extends Component {
  constructor(data) {
    super(data);
    this.template = '<div class="oneApi">' + '<div id="back-button-holder"></div>' + '</div>';
    this.viewTitle = this.addChild(
      new ViewTitle({
        id: this.id + '-view-title',
        heading: getText('api'),
        spinner: true,
      })
    );
    this.formId;
    this.apiData;
    this.appState = this.Router.commonData.appState;
    this.readApi;
    this.dialogForms = new DialogForms({ id: 'dialog-forms-one-user' });
    this.Toaster = this.appState.get('Toaster');
  }

  init = () => {
    this.formId = this.Router.getRouteParams().formId;
    this.readApi = new ReadApi({ url: '/settings/apis/' + this.formId });
    this.viewTitle.draw();
    this._loadOneApiData();
  };

  _loadOneApiData = async () => {
    this.apiData = null;
    this.viewTitle.showSpinner(true);

    this.apiData = await this.readApi.getData();
    this.viewTitle.showSpinner(false);
    if (this.apiData.redirectToLogin) {
      this.Router.changeRoute('/logout?r=' + this.Router.getRoute(true));
      return;
    }

    if (this.apiData.error && this.apiData.exception) {
      const exception = this.apiData.exception;
      const status = exception.response.status;
      this.appState.get('updateMainMenu')({ tools: [] });
      if (status === 401) {
        this.addChildDraw(new FourOOne({ id: 'one-api-401' }));
      } else if (status === 404) {
        this.addChildDraw(
          new FourOFour({
            id: 'one-api-404',
            bodyText: getText('user_not_found'),
          })
        );
      } else {
        this.addChildDraw({
          id: 'one-api-bigerror',
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
      { id: 'formId', tag: 'h1', label: getText('form_id') },
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

      if (this.apiData[id] === undefined) {
        continue;
      } else if (id === 'created') {
        value = createDate(this.apiData[id].date);
      } else if (id === 'edited' && this.apiData[id][0]) {
        const lastIndex = this.apiData[id].length - 1;
        value = createDate(this.apiData[id][lastIndex].date);
      } else if (id === 'userLevel') {
        if (id === 'userLevel') value = getText('user_level_' + this.apiData[id]);
      } else if (id === 'email' && this.appState.get('serviceSettings.useEmailVerification')) {
        value = this.apiData[id];
        const isVerified =
          this.apiData.security &&
          this.apiData.security.verifyEmail &&
          this.apiData.security.verifyEmail.verified;
        verificationStatus = isVerified
          ? `&nbsp;&nbsp;&nbsp;&nbsp;(${getText('verified')})`
          : `&nbsp;&nbsp;&nbsp;&nbsp;(${getText('unverified')})`;
      } else {
        value = this.apiData[id];
      }
      if (!value.length) value = '&nbsp;';
      this.addChildDraw({
        id: 'user-data-' + id,
        template: `<div class="${styles.apiDataItem}">
            <span class="${styles.apiDataItem__label}">
                ${item.label}
                <span class="${styles.apiDataItem__labelSmaller}">${verificationStatus}</span>
              </span>
            <${tag} class="${styles.apiDataItem__value}">${value}</${tag}>
          </div>`,
      });
    }
  };

  _createTools = () => {
    let tools = null;
    const loggedIn = this.appState.get('user').loggedIn;
    const updateMainMenu = this.appState.get('updateMainMenu');
    if (loggedIn && this.apiData.id) {
      // If the userData.id is present, then the current user has admin rights
      const Dialog = this.Router.commonData.appState.get('Dialog');
      tools = [
        // {
        //   id: 'edit-user-tool',
        //   type: 'button',
        //   text: getText('edit'),
        //   click: () => {
        //     if (!this.apiData) return;
        //     this.dialogForms.createEditDialog({
        //       id: 'edit-user-form',
        //       title: getText('edit_user') + ': ' + this.apiData.username,
        //       editDataId: this.apiData.id,
        //       addToMessage: { userId: this.apiData.id },
        //       afterFormSentFn: () => {
        //         this.appState.get('Toaster').addToast({
        //           type: 'success',
        //           content: getText('user_updated'),
        //         });
        //         this._loadUserData();
        //       },
        //       onErrorFn: () => {
        //         this.appState.get('Toaster').addToast({
        //           type: 'error',
        //           content: `${getText('error')}: could not edit user`,
        //           delay: 0,
        //         });
        //         this._loadUserData();
        //       },
        //     });
        //   },
        // },
        // {
        //   id: 'user-exposure-tool',
        //   type: 'button',
        //   text: getText('exposure'),
        //   click: () => {
        //     if (!this.apiData) return;
        //     this.dialogForms.createEditDialog({
        //       id: 'edit-expose-profile-form',
        //       title: getText('profile_exposure') + ': ' + this.apiData.username,
        //       editDataId: this.apiData.id,
        //       addToMessage: { userId: this.apiData.id },
        //       afterFormSentFn: () => {
        //         this.appState.get('Toaster').addToast({
        //           type: 'success',
        //           content: getText('user_updated'),
        //         });
        //         this._loadUserData();
        //       },
        //       onErrorFn: () => {
        //         this.appState.get('Toaster').addToast({
        //           type: 'error',
        //           content: `${getText('error')}: could not edit user exposure`,
        //           delay: 0,
        //         });
        //         this._loadUserData();
        //       },
        //     });
        //   },
        // },
        // {
        //   id: 'user-logs-tool',
        //   type: 'button',
        //   text: getText('logs'),
        //   click: () => {
        //     if (!this.apiData) return;
        //     Dialog.appear({
        //       component: Logs,
        //       componentData: {
        //         id: 'user-logs-dialog',
        //         userData: this.apiData,
        //       },
        //     });
        //   },
        // },
      ];
    }
    updateMainMenu({
      backButton: true,
      tools,
    });
  };
}

export default OneApi;
