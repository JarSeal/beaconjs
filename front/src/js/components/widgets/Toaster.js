import { Component } from '../../LIGHTER';

class Toaster extends Component {
  constructor(data) {
    super(data);
    this.toastsList = {};
  }

  paint = () => {
    this.addChildDraw({ id: 'toaster-list' });
  };

  addToast = ({ type, delay, text }) => {
    console.log('Toast added', this.toastsList);
    if (!type) type = 'info';
    if (delay === undefined) delay = 5000;
    const toastId = 'toast-' + performance.now();
    this.toastsList[toastId] = {
      id: toastId,
      type,
      text,
      delay,
      timeoutFn: setTimeout(() => {
        console.log('timeout ' + toastId + ' ended.', this.toastsList);
        delete this.toastsList[toastId];
        console.log('timeout ' + toastId + ' ended.', this.toastsList);
      }, delay),
    };
  };
}

export default Toaster;
