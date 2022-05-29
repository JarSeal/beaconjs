import { RouterRef } from './Router';
import { Logger } from './utils';

const ids = {};
const logger = new Logger('LIGHTER.js COMPO *****');

class Component {
  constructor(data) {
    if (!data || !data.id) {
      logger.error('Component id missing.', data);
      throw new Error('Call stack');
    }
    if (ids[data.id]) {
      if (data.autoDiscard === undefined) data.autoDiscard = true; // Default is true
      if (data.autoDiscard) {
        ids[data.id].discard(true);
      } else {
        logger.error('ID is already in use.', data);
        throw new Error('Call stack');
      }
    }
    ids[data.id] = this;
    this.id = data.id;
    this.data = data;
    this.parent;
    this.parentId = data.parentId ? data.parentId : null;
    this.template;
    this.elem;
    this.drawing = false;
    this.discarding = false;
    this.listeners = {};
    this.children = {};
    this.simpletonIndex = 0;
    this.Router = RouterRef;
    this.logger = logger;
    this.firstDraw = true;
    this.isComponent = true;
    // *****************
    // [ RESERVED KEYS ]
    // data = {
    //     id, (required, string)
    //     parentId (optional, string, used when addChild from with the parent method is not possible)
    //     replace (optional, boolean, default=false, whether the Component should replace the parent's innerHTML or not)
    //     class (optional, string/array, element classe(s))
    //     style (optional, flat object, element inline style(s))
    //     attributes (optional, flat object, element attributes as key and value as value)
    //     appendHtml (optional, string, element's appended innerHTML text/html)
    //     prepend (optional, boolean, use prepend instead append)
    //     html (optional, string, element's replacing innerHTML text/html)
    //     text (optional, string, element innerText text)
    //     tag (optional, string, element tag name/type)
    //     attach (optional, string, an alternate element id to add the component)
    //     template (optional, string, default=<div id="${data.id}"></div>, element HTML)
    //     noRedraws (optional, boolean, whether the element shouldn't be redrawn after the first draw)
    //     autoDiscard (optional, boolean, whether the component should self discard on initiation)
    // }
  }

  draw(drawInput) {
    // Main Component drawing logic
    if (this.drawing || this.discarding) return;
    this.drawing = true;
    if (!this.parentId) {
      this.drawing = false;
      logger.error(
        'Parent id missing. New Component creation should have a parentId or the the creation should be wrapped in this.addChild() method.',
        this.data
      );
      throw new Error('Call stack');
    }
    let data = this.data;
    if (drawInput) data = Object.assign(this.data, drawInput);
    if (!this.firstDraw && data.noRedraws) {
      this.drawing = false;
      return;
    }
    if (this.elem) this.discard();
    this.parent = document.getElementById(data.attach || this.parentId);
    if (!this.template) this.template = data.template || this._createDefaultTemplate(this.id, data);
    this.template = this._templateId(this.template, data);
    if (data.replace) {
      // Exclusive element draw to parent's innerHTML
      this.parent.innerHTML = this.template;
    } else {
      // Append element as parent's child
      const template = document.createElement('template');
      template.innerHTML = this.template;
      if (this.parent) {
        data.prepend
          ? this.parent.prepend(template.content.firstChild)
          : this.parent.append(template.content.firstChild);
      }
    }
    this.elem = document.getElementById(this.id);
    this._setElemData(this.elem, data);
    if (this.firstDraw) {
      this.init(data);
      this.firstDraw = false;
    }
    this.paint(data);
    this.addListeners(data);
    this.simpletonIndex = 0;
    this.drawing = false;
  }

  reDrawSelf(drawInput) {
    this.simpletonIndex = 0;
    this.draw(drawInput);
  }

  rePaint() {
    this.simpletonIndex = 0;
    this.paint(this.data);
  }

  init() {}
  paint() {}

  discard(fullDiscard, callback) {
    if (this.discarding) return;
    this.discarding = true;
    // Remove listeners
    let keys = Object.keys(this.listeners);
    for (let i = 0; i < keys.length; i++) {
      this.removeListener(keys[i]);
    }
    // Discard children
    keys = Object.keys(this.children);
    for (let i = 0; i < keys.length; i++) {
      this.children[keys[i]].discard(fullDiscard);
      if (fullDiscard) delete this.children[keys[i]];
    }
    // Remove element from DOM
    if (this.elem) {
      this.elem.remove();
      this.elem = null;
    }
    if (fullDiscard) delete ids[this.id];
    this.erase();
    this.discarding = false;
    if (callback) callback();
  }

  erase() {} // Additional discard logic from the custom Component

  drawHTML = (data) => {
    const id = this.id + '-simpleton-' + this.simpletonIndex;
    const compData = Object.assign({}, { id }, data);
    let compo = this.children[id];
    if (!compo) compo = this.addChild(compData);
    compo.draw();
    this.simpletonIndex++;
  };

  drawChildren = (full) => {
    const keys = Object.keys(this.children);
    for (let i = 0; i < keys.length; i++) {
      this.children[keys[i]].draw();
      if (full) this.children[keys[i]].drawChildren();
    }
  };

  addChild(component) {
    if (!component.isComponent) component = new Component(component);
    this.children[component.id] = component;
    component.parentId = this.id;
    return component;
  }

  addChildDraw = (component) => this.addChild(component).draw();

  discardChild(id, notFull) {
    if (!this.children[id]) return;
    let fullDiscard = true;
    if (notFull) fullDiscard = false;
    this.children[id].discard(fullDiscard);
    delete this.children[id];
    delete ids[id];
  }

  addListener(listener) {
    let { id, target, type, fn } = listener;
    if (!type || !fn) {
      logger.error('Could not add listener, type, and/or fn missing.');
      throw new Error('Call stack');
    }
    if (!id) {
      id = this.id;
      listener.id = id;
    }
    if (!target) {
      if (target === null) {
        logger.error('Could not add listener, target elem was given but is null.');
        throw new Error('Call stack');
      }
      target = this.elem;
      listener.target = target;
    }
    if (this.listeners[id]) this.removeListener(id);
    if (!target) return;
    target.addEventListener(type, fn);
    this.listeners[id] = listener;
  }

  addListeners() {}

  registerListeners() {
    const listeners = this.defineListeners();
    for (let i = 0; i < listeners.length; i++) {
      this.addListener(listeners[i]);
    }
  }

  removeListener(id) {
    if (!id) {
      logger.error('Could not remove listener, id missing.');
      throw new Error('Call stack');
    }
    const { target, type, fn } = this.listeners[id];
    target.removeEventListener(type, fn);
    delete this.listeners[id];
  }

  _templateId(template, data) {
    if (
      !template.includes(`id="${data.id}"`) &&
      !template.includes(`id='${data.id}'`) &&
      !template.includes(`id=${data.id}`)
    ) {
      template = template.trim();
      const parts = template.split('>');
      parts[0] = parts[0].trim();
      parts[0] += ` id="${data.id}"`;
      template = parts.join('>');
    }
    return template;
  }

  _setElemData(elem, data) {
    if (!elem) return;
    if (data.class) {
      if (typeof data.class === 'string' || data.class instanceof String) {
        elem.classList.add(data.class);
      } else {
        // data.class is propably an array then
        elem.classList.add(...data.class);
      }
    }
    if (data.attributes) {
      const keys = Object.keys(data.attributes);
      for (let i = 0; i < keys.length; i++) {
        elem.setAttribute(keys[i], data.attributes[keys[i]]);
      }
    }
    if (data.style) {
      const keys = Object.keys(data.style);
      for (let i = 0; i < keys.length; i++) {
        elem.style[keys[i]] = data.style[keys[i]];
      }
    }
    if (data.text) elem.innerText = data.text;
    if (data.html) elem.innerHTML = data.html;
    if (data.appendHtml) elem.innerHTML += data.appendHtml;
  }

  _createDefaultTemplate(id, data) {
    const tag = data && data.tag ? data.tag : false;
    if (tag) {
      return `<${tag} id="${id}"></${tag}>`;
    } else {
      return `<div id="${id}"></div>`; // Default
    }
  }
}

export default Component;
