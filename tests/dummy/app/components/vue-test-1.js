import { wrap } from "ember-vue-components";
import hbs from "htmlbars-inline-precompile";

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
    };
  },
  watch: {
    age() {
      // eslint-disable-next-line no-console
      console.log("age changed");
    }
  },
  computed: {
    fullAge() {
      return this.age * 356;
    }
  },
  actions: {
    click() {
      this.age++;
    }
  }
});
