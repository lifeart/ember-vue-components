ember-vue-components
==============================================================================

This addon provide "Vue" 2.x component api for Ember.
May be useful in migration purposes or if you from Vue world and wanna try Ember.

Compatibility
------------------------------------------------------------------------------

* Ember.js v2.18 or above
* Ember CLI v2.13 or above
* Node.js v8 or above


Installation
------------------------------------------------------------------------------

```
ember install ember-vue-components
```


Usage
------------------------------------------------------------------------------



```js
// app/components/vue-component.js
import { wrap } from 'ember-vue-components';
import hbs from 'htmlbars-inline-precompile';

export default wrap({
  template: hbs`
    <div>
      My age is {{this.age}}, full age is: {{this.fullAge}} days.
      <button {{action "click"}}>Increment</button>
    </div>
  `,
  data() {
    return {
	  age: 0
	}
  },
  watch: {
    age() {
      console.log('age changed');
    }
  },
  computed: {
    fullAge() {
      return this.age * 356;
    }
  },
  actions: {
    click() {
      this.name++;
    }
  }
});

```

Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
