import Component from '../../../LIGHTER/Component';

// Attributes:
// - text = button label/text [string]
// - disabled = whether the field is disabled or not [boolean]
class SubmitButton extends Component {
  constructor(data) {
    super(data);
    this.template = '<button type="submit" class="form-elem form-elem--submit"></button>';
  }

  paint = (data) => {
    if (data.disabled) this.elem.setAttribute('disabled', '');
  };
}

export default SubmitButton;
