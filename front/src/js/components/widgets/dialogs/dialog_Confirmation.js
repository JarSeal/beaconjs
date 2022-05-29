import { Component } from '../../../LIGHTER';
import { getText } from '../../../helpers/lang';
import Button from '../../buttons/Button';
import Spinner from '../Spinner';

// Attributes:
// - Dialog: Dialog class
// - message: String
// - confirmButtonText: String
// - confirmButtonFn: Function
// - cancelButtonText: String
// - cancelButtonFn: Function
// - noCancelButton: Boolean (hide cancel button)
// - confirmSpinner: Boolean (show spinner after confirmation)
class ConfirmationDialog extends Component {
  constructor(data) {
    super(data);
    this.Dialog = this.data.Dialog;
    if (data.confirmSpinner) {
      this.spinner = this.addChild(new Spinner({ id: 'confirmation-spinner' }));
    }
    this.template = '<div class="confirmation-dialog">' + `<p>${data.message}</p>` + '</div>';
  }

  paint = () => {
    if (!this.data.noCancelButton) {
      this.addChild(
        new Button({
          id: this.id + '-cancel-button',
          text: this.data.cancelButtonText || getText('cancel'),
          class: 'cancel-button',
          click: () => {
            if (this.Dialog.isLocked) return;
            if (this.data.cancelButtonFn) {
              this.data.cancelButtonFn();
            } else {
              this.Dialog.disappear();
            }
          },
        })
      ).draw();
    }
    this.addChild(
      new Button({
        id: this.id + '-confirm-button',
        text: this.data.confirmButtonText || getText('confirm'),
        class: ['confirm-button', 'confirm-button--delete'],
        click: () => {
          if (this.Dialog.isLocked) return;
          if (this.data.confirmButtonFn) {
            if (this.data.confirmSpinner) this.spinner.showSpinner(true);
            this.data.confirmButtonFn();
          } else {
            this.Dialog.disappear();
          }
        },
      })
    ).draw();
    if (this.data.confirmSpinner) this.spinner.draw();
  };
}

export default ConfirmationDialog;
