import { getText } from '../../helpers/lang';
import { Component } from '../../LIGHTER';
import ViewTitle from '../widgets/ViewTitle';
import DialogForms from '../widgets/dialogs/dialog_Forms';

class VerifyWToken extends Component {
  constructor(data) {
    super(data);
    this.appState = data.appState;
    this.viewTitle = this.addChild(
      new ViewTitle({
        id: this.id + '-view-title',
        heading: data.title,
      })
    );
    this.dialogForms = new DialogForms({ id: 'dialog-forms-verification-needed' });
  }

  addListeners = () => {
    this.addListener({
      id: 'new-email-veri-link-id',
      type: 'click',
      target: document.getElementById('newVerificationLink'),
      fn: () => {
        this.dialogForms.createEmptyFormDialog({
          id: 'new-email-verification',
          title: getText('send_new_email_verification_link'),
          onErrorFn: () => {},
          cancelButton: true,
        });
      },
    });
  };

  init = () => {
    this.viewTitle.draw();
    this.addChildDraw({
      id: 'verification-needed-body',
      text: getText('verification_needed_body'),
      tag: 'p',
    });
    this.addChildDraw({
      id: 'newVerificationLink',
      template: `<a class="link">
                ${getText('new_verification_link')}
            </a>`,
    });
  };
}

export default VerifyWToken;
