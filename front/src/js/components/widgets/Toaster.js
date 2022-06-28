import { Component } from '../../LIGHTER';

import styles from './Toaster.module.scss';

class Toaster extends Component {
  constructor(data) {
    super(data);
    data.class = styles.toaster;
    this.showTransitionTime = 350;
    this.hideTransitionTime = 200;
  }

  paint = () => {
    this.addChildDraw({
      id: 'toaster-list',
      class: 'toaster__list',
    });
  };

  addToast = ({ type, delay, content }) => {
    if (!type) type = 'info'; // info, error, success, warning
    if (delay === undefined) delay = 4500; // zero is "forever"
    const now = performance.now();
    const toastId = 'toast-' + now;
    this.addChildDraw(
      new Toast({
        id: toastId,
        attach: 'toaster-list',
        prepend: true,
        showTransitionTime: this.showTransitionTime,
        hideTransitionTime: this.hideTransitionTime,
        animating: false,
        toastData: {
          type,
          content,
          delay,
          startTime: now,
          onRemoveCallback: () => this.discardChild(toastId),
        },
        style: { transitionDuration: this.showTransitionTime + 'ms' },
      })
    );
    return toastId;
  };
}

class Toast extends Component {
  constructor(data) {
    super(data);
    this.toastData = data.toastData;
    this.showTransitionTime = data.showTransitionTime;
    this.hideTransitionTime = data.hideTransitionTime;
    data.class = [styles.toast, this._getToastClass(data.toastData.type)];
    this.template = `<div>
      <button id="${this.id}-closeBtn" class="${styles.toast__close}"></button>
      <span>${data.toastData.content}</span>
    </div>`;
  }

  addListeners = () => {
    this.addListener({
      id: this.id + '-close-listener',
      target: document.getElementById(this.id + '-closeBtn'),
      type: 'click',
      fn: () => {
        this._closeToast();
      },
    });
  };

  paint = () => {
    if (!this.toastData.initted) {
      setTimeout(() => {
        this.data.animating = true;
        this.elem.classList.add(styles.toast__show);
      }, 10);
      this.toastData.initted = true;
    } else {
      this.elem.classList.add(styles.toast__show);
    }
    if (this.toastData.delay > 0) {
      const fullTime = this.toastData.delay + this.showTransitionTime + 10;
      setTimeout(() => {
        this.data.animating = true;
        this._closeToast();
      }, fullTime);
    }
  };

  _getToastClass = (type) => styles['toast__' + type];

  _closeToast = () => {
    if (!this.elem) return;
    this.elem.style.transitionDuration = this.hideTransitionTime + 'ms';
    this.elem.classList.add(styles.toast__beforeHide);
    this.elem.style.height = this.elem.offsetHeight + 'px';
    setTimeout(() => {
      this.elem.classList.add(styles.toast__hide);
      setTimeout(() => {
        this.toastData.onRemoveCallback();
      }, this.hideTransitionTime + 10);
    }, 10);
  };
}

export default Toaster;
