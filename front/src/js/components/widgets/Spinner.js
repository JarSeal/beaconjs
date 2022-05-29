import { Component } from '../../LIGHTER';

// Attributes for data:
// - show = show the spinner or not [boolean]
// - fadeTime = spinner in and out fade time in milliseconds [integer]
class Spinner extends Component {
  constructor(data) {
    super(data);
    this.template = '<div class="spinner-icon"></div>';
    this.spinnerAnimTimer;
    this.prevShow = data.show;
    this.fadeTime = (data.fadeTime || 400) + 10;
    data.style = { transitionDuration: this.fadeTime + 'ms' };
  }

  paint = (data) => {
    this.showSpinner(data.show);
  };

  showSpinner = (show) => {
    if ((show && this.prevShow) || (!show && !this.prevShow)) return;
    this.prevShow = show;
    const elem = this.elem;
    if (!elem) return;
    if (show) {
      elem.style.display = 'inline-block';
      clearTimeout(this.spinnerAnimTimer);
      this.spinnerAnimTimer = setTimeout(() => {
        elem.classList.add('show-spinner');
      }, 10);
    } else {
      elem.style.display = 'inline-block';
      elem.classList.add('show-spinner');
      setTimeout(() => {
        elem.classList.remove('show-spinner');
        clearTimeout(this.spinnerAnimTimer);
        this.spinnerAnimTimer = setTimeout(() => {
          elem.style.display = 'none';
        }, this.fadeTime);
      }, this.fadeTime / 4);
    }
  };
}

export default Spinner;
