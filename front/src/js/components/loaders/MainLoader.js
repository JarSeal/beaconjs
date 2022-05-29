import { Component } from '../../LIGHTER';
import './MainLoader.scss';

class MainLoader extends Component {
  constructor(data) {
    super(data);
    this.fadeTime = 200; // in milliseconds
    this.template = '<div>Loading..</div>';
    data.style = { transitionDuration: this.fadeTime + 'ms' };
  }

  paint = () => {
    this.toggle(true);
  };

  toggle(show) {
    this.elem = document.getElementById(this.id);
    if (show) {
      this.elem.classList.add('show');
    } else {
      this.elem.classList.remove('show');
    }
  }

  show() {
    this.toggle(true);
  }

  hide(callback) {
    this.toggle(false);
    if (callback) {
      setTimeout(() => {
        callback();
      }, this.fadeTime);
    }
  }
}

export default MainLoader;
