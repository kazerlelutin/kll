import component from "./lib/component.mjs";
import l from "./lib/createElement.mjs";

const kll = new Proxy(
    { rerender: false, render: null, onmount: [] },
    {
      set: async (obj, prop, value) => {
        obj[prop] = value;
        if (prop.match(/render/) && Array.isArray(obj.render)) {
          await render(obj.render[0], obj.render[1]);
        }
        return true;
      },
    }
  ),
  k = (comp, props) => component(comp, kll, props);

async function render(target, elements) {
  target.innerHTML = "";
  //element = object avec view && on ready
  const el = elements();
  target.appendChild(elements());
  for (const f of kll.onmount) {
    const { state, func } = f;
    await func(state, el);
  }
}

export { kll as default, k, l };
