import { getText } from '../../../helpers/lang';
import { Component } from '../../../LIGHTER';
import FormCreator from '../../forms/FormCreator';

class DialogForms extends Component {
  constructor(data) {
    super(data);
    this.appState = this.Router.commonData.appState;
    this.Dialog = this.appState.get('Dialog');
  }

  createDeleteDialog = (params) => {
    const { id, title, addToMessage, formDesc, afterFormSentFn, onErrorFn } = params;
    if (!this.Dialog) this.Dialog = this.appState.get('Dialog');
    this.Dialog.appear({
      component: FormCreator,
      componentData: {
        id,
        appState: this.appState,
        dialog: this.Dialog,
        beforeFormSendingFn: () => {
          this.Dialog.lock();
        },
        formDesc,
        afterFormSentFn: (response) => {
          this.Dialog.disappear();
          if (afterFormSentFn) afterFormSentFn(response);
        },
        addToMessage,
        onErrorsFn: (ex, res) => {
          this.Dialog.unlock();
          if (onErrorFn) onErrorFn(ex, res);
          if (res && res.status === 401 && res.data.loggedIn !== false) {
            this.Router.changeRoute('/');
          }
        },
        onFormChanges: () => {
          this.Dialog.changeHappened();
        },
        formLoadedFn: () => {
          this.Dialog.onResize();
        },
        extraButton: {
          label: getText('cancel'),
          clickFn: (e) => {
            e.preventDefault();
            this.Dialog.disappear();
          },
        },
      },
      title,
    });
  };

  createEmptyFormDialog = (params) => {
    const { id, title, afterFormSentFn, onErrorFn, cancelButton } = params;
    if (!this.Dialog) this.Dialog = this.appState.get('Dialog');
    this.Dialog.appear({
      component: FormCreator,
      componentData: {
        id,
        appState: this.appState,
        dialog: this.Dialog,
        beforeFormSendingFn: () => {
          this.Dialog.lock();
        },
        afterFormSentFn: (response) => {
          this.Dialog.disappear();
          if (afterFormSentFn) afterFormSentFn(response);
        },
        onErrorsFn: (ex, res) => {
          this.Dialog.unlock();
          if (onErrorFn) onErrorFn(ex, res);
          if (res && res.status === 401 && res.data.loggedIn !== false) {
            this.Router.changeRoute('/');
          }
        },
        onFormChanges: () => {
          this.Dialog.changeHappened();
        },
        formLoadedFn: () => {
          this.Dialog.onResize();
        },
        extraButton: cancelButton
          ? {
              label: getText('cancel'),
              clickFn: (e) => {
                e.preventDefault();
                this.Dialog.disappear();
              },
            }
          : null,
      },
      title,
    });
  };

  createEditDialog = (params) => {
    const { id, title, addToMessage, editDataId, afterFormSentFn, onErrorFn } = params;
    if (!this.Dialog) this.Dialog = this.appState.get('Dialog');
    this.Dialog.appear({
      component: FormCreator,
      componentData: {
        id,
        appState: this.appState,
        editDataId,
        dialog: this.Dialog,
        beforeFormSendingFn: () => {
          this.Dialog.lock();
        },
        afterFormSentFn: (response) => {
          this.Dialog.disappear();
          if (afterFormSentFn) afterFormSentFn(response);
        },
        addToMessage,
        onErrorsFn: (ex, res) => {
          this.Dialog.unlock();
          if (onErrorFn) onErrorFn(ex, res);
          if (res && res.status === 401 && res.data && res.data.loggedIn && !res.data.noRedirect) {
            this.Router.changeRoute('/');
          }
        },
        onFormChanges: () => {
          this.Dialog.changeHappened();
        },
        formLoadedFn: () => {
          this.Dialog.onResize();
        },
        extraButton: {
          label: getText('cancel'),
          clickFn: (e) => {
            e.preventDefault();
            this.Dialog.disappear();
          },
        },
      },
      title,
    });
  };
}

export default DialogForms;
