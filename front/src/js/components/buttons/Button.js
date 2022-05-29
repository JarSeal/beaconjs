import Component from '../../LIGHTER/Component';

// Attributes:
// - click = clickFn
class Button extends Component {
  constructor(data) {
    super(data);
    if (!data.template) {
      this.template = '<button type="button"></button>';
    } else {
      this.template = data.template;
    }
    this.click = data.click;
  }

  init = () => {
    this.addListener({
      id: this.id + '-listener',
      type: 'click',
      fn: this.click,
    });
  };
}

export default Button;
