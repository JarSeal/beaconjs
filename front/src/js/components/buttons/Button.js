import Component from '../../LIGHTER/Component';

// Attributes:
// - click = click
class Button extends Component {
  constructor(data) {
    super(data);
    if (!data.click) {
      console.error('Button must have a clickFn declared.', this.id);
    }
    if (!data.template) {
      this.template = '<button type="button"></button>';
    } else {
      this.template = data.template;
    }
    this.click = data.click;
  }

  addListeners = () => {
    this.addListener({
      id: this.id + '-listener',
      type: 'click',
      fn: this.click,
    });
  };
}

export default Button;
