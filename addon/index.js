import { observer, set } from "@ember/object";
import Component from "@ember/component";
const noop = function() {};

const handler = {
  get(target, name) {
    if (name === '$content') {
      return target;
    }
    if (name.startsWith('_')) {
      return target[name];
    }
    if (typeof target[name] === "object" && target[name] !== null) {
      return new Proxy(target[name], handler);
    }
    return target[name];
  },
  set(target, name, value) {
    set(target, name, value);
    return true;
  },
  has(target, name) {
    return name in target;
  }
};

function proxify(originalFn) {
  return function(...args) {
    return originalFn.apply(new Proxy(this, handler), args);
  };
}

const API_PROPS = [
  'beforeCreate', 'created',
  'beforeMounted' , 'mounted',
  'beforeUpdate', 'updated',
  'beforeDestroy',  'destroyed',
  'data', 'methods', 'actions',
  'watch', 'computed', 'template'
];

export function wrap(input) {
  const defaultData = {
    beforeCreate: input.beforeCreate || noop,
    beforeUpdate: input.beforeUpdate || noop,
    beforeDestroy: input.beforeDestroy || noop,
    beforeMounted: input.beforeMounted || noop,
    created: input.created || noop,
    mounted: input.mounted || noop,
    updated: input.updated || noop,
    destroyed: input.destroyed || noop,
    tagName: "",
    willDestroyElement() {
      this.beforeDestroy();
    },
    didDestroyElement() {
      this.destroyed();
    },
    init() {
      this.beforeCreate();
      this._super(...arguments);
      this.dataKeys = {};
      if (typeof input.data === "object") {
        this.dataKeys = JSON.parse(JSON.stringify(input.data));
      } else if (typeof input.data === "function") {
        this.dataKeys = input.data();
      }
      Object.keys(this.actions).forEach((action)=>{
        this[action] = this.actions[action].bind(this);
      });
      this.setProperties(this.dataKeys);
      this.created();
      this.beforeMounted();
    },
    willUpdate() {
      this.beforeUpdate();
      this.triggerComputeds();
    },
    didInsertElement() {
      this.mounted();
    },
    didRender() {
      this.updated();
    },
    triggerComputeds() {
      Object.keys(input.computed).forEach(key => {
        this.notifyPropertyChange(key);
      });
    },
    actions: input.actions || input.methods || {}
  };

  if (input.template) {
    defaultData.layout = input.template;
  }

  Object.keys(defaultData.actions).forEach(actionName => {
    const originalAction = defaultData.actions[actionName];
    defaultData.actions[actionName] = proxify(originalAction);
  });

  Object.keys(input.watch).forEach(propName => {
    const originalObserver = input.watch[propName];
    // eslint-disable-next-line ember/no-observers
    defaultData["_ob_" + propName] = observer(propName, proxify(originalObserver));
  });
  Object.keys(input.computed).forEach(propName => {
    const cp = input.computed[propName];
    const isCpFunction = typeof cp === "function";
    const descr = {
      get: isCpFunction ? cp : cp.get,
      set: isCpFunction
        ? function() {
            throw new Error(`Unable to rewrite computed property ${propName}!`);
          }
        : cp.set,
      enumerable: false,
      configurable: true
    };
    Object.defineProperty(defaultData, propName, descr);
  });

  const fns = {};
  Object.keys(input).forEach((key)=>{
    if (!API_PROPS.includes(key)) {
      fns[key] = input[key];
    }
  });

  return Component.extend(defaultData, fns);
}
