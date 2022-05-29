import { getText } from '../../helpers/lang';
import { Component } from '../../LIGHTER';
import Button from '../buttons/Button';

// Attributes for data:
//
class Dialog extends Component {
  constructor(data) {
    super(data);
    this.data = data;
    this.appState = data.appState;
    this.transitionTime = 140; // in milliseconds
    data.style = { transitionDuration: this.transitionTime + 'ms' };
    data.class = ['dialog', 'alpha-black'];
    this.isShowing = false;
    this.isTransitioning = false;
    this.isLocked = false;
    this.hasChanges = false;
    this.compoToShow;
    this.dialogTitle;
    this.resizeTimer;

    this.dialogCompos = [];
    this.dialogCompos.push(
      this.addChild({
        id: this.id + '-box-wrapper',
        class: 'dialog-box',
        style: { transitionDuration: this.transitionTime + 'ms' },
      })
    );
    this.dialogCompos.push(
      this.addChild(
        new Button({
          id: this.id + '-close-button',
          class: 'close-button',
          attach: this.id + '-box-wrapper',
          attributes: { title: getText('close_dialog') },
          click: this._closeDialogClick,
        })
      )
    );
    this.dialogCompos.push(
      this.addChild({
        id: this.id + '-inner-scroller',
        class: 'inner-scroller',
        attach: this.id + '-box-wrapper',
      })
    );
    this.dialogCompos.push(
      this.addChild({
        id: this.id + '-inner-box',
        class: 'inner-box',
        attach: this.id + '-inner-scroller',
      })
    );
  }

  addListeners = () => {
    this.appState.set('resizers.dialog', this.onResize);

    this.addListener({
      id: this.id + '-background-click',
      type: 'click',
      fn: this._closeDialogClick,
    });
  };

  paint = (data) => {
    for (let i = 0; i < this.dialogCompos.length; i++) {
      this.dialogCompos[i].draw();
    }
    if (this.dialogTitle) {
      this.dialogTitle.draw();
      this.elem.classList.add('has-title');
    }
    if (this.compoToShow) this.compoToShow.draw();
    if (data.appear) {
      setTimeout(() => {
        if (this.elem) this.elem.classList.add('appear');
      }, 20);
    }
    this._setSizes();
  };

  appear = (dialogData) => {
    if (this.isShowing) this.disappear();
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.hasChanges = false;
    this.compoToShow = this.addChild(new dialogData.component(dialogData.componentData));
    this.compoToShow.data.attach = this.id + '-inner-box';
    if (dialogData.title) {
      this.dialogTitle = this.addChild({
        id: this.id + '-main-title',
        class: 'main-title',
        tag: 'h3',
        text: dialogData.title,
        attach: this.id + '-box-wrapper',
      });
    }
    this.draw({ appear: true });
    this.isShowing = true;
    setTimeout(() => {
      this.isTransitioning = false;
    }, this.transitionTime + 50);
  };

  disappear = () => {
    if (!this.elem || this.isTransitioning) return;
    this.isTransitioning = true;
    this.elem.classList.remove('appear');
    this.isShowing = false;
    this.hasChanges = false;

    this.appState.remove('resizers.dialog');

    setTimeout(() => {
      this.unlock();
      this.dialogTitle = null;
      this.discard(true, () => {
        setTimeout(() => {
          this.isTransitioning = false;
        }, 300);
      });
    }, this.transitionTime);
  };

  lock = () => {
    if (!this.elem) return;
    this.elem.classList.add('dialog-locked');
    this.isLocked = true;
  };

  unlock = () => {
    if (!this.elem) return;
    this.elem.classList.remove('dialog-locked');
    this.isLocked = false;
  };

  _closeDialogClick = (e) => {
    if (this.isLocked) return;
    e.stopPropagation();
    const targetId = e.target.id;
    if (targetId === this.id || targetId === this.id + '-close-button') {
      if (this.hasChanges) {
        if (confirm(getText('changes_will_be_lost_prompt'))) {
          this.disappear();
        }
      } else {
        this.disappear();
      }
    }
  };

  _setSizes = () => {
    if (!this.elem) return;
    const titleElem = this.elem.querySelector('#' + this.id + '-main-title');
    const scrollElem = this.elem.querySelector('#' + this.id + '-inner-scroller');
    scrollElem.style.height = 'auto';
    let titleHeight = 0;
    if (titleElem) titleHeight = titleElem.offsetHeight;
    const boxElem = this.elem.querySelector('#' + this.id + '-box-wrapper');
    boxElem.style.paddingTop = titleHeight / 10 + 'rem';
    clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      scrollElem.style.height = (boxElem.offsetHeight - titleHeight) / 10 + 0.1 + 'rem';
    }, 100);
  };

  onResize = () => {
    this._setSizes();
  };

  changeHappened = () => {
    if (this.dialogTitle && this.hasChanges === false) {
      // Create the asterix after the data when the dialog has a change for the first time
      this.dialogTitle.draw({ text: this.dialogTitle.data.text + ' *' });
    }
    this.hasChanges = true;
  };
}

export default Dialog;
