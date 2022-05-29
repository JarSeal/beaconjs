import Component from '../../LIGHTER/Component';

// Attributes:
// - link = String (Router link/path)
// - bypassCurrentCheck = Boolean (change route even if the target route is the same as the current one)
class RouteLink extends Component {
  constructor(data) {
    super(data);
    this.isCurrent = false;
    let tag = 'button';
    if (data.tag) tag = data.tag;
    this.template = `<${tag}></${tag}>`;
  }

  addListeners = () => {
    this.addListener({
      id: this.id + '-listener',
      type: 'click',
      fn: this.click,
    });
  };

  paint = (data) => {
    if (this.Router.isCurrent(data.link)) {
      setTimeout(() => {
        if (this.elem) this.elem.classList.add('current');
      }, 50);
      this.isCurrent = true;
    } else {
      setTimeout(() => {
        if (this.elem) this.elem.classList.remove('current');
      }, 50);
      this.isCurrent = false;
    }
  };

  click = (e) => {
    e.preventDefault();
    if (this.isCurrent && !this.data.bypassCurrentCheck) return;
    this.Router.changeRoute(this.data.link, { forceUpdate: true });
  };
}

export default RouteLink;
