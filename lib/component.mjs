export default function component(comp, kll, props) {
  const p = new Proxy(
    { ...comp.state },
    {
      set: (obj, prop, value) => {
        if (JSON.stringify(obj[prop]) !== JSON.stringify(value)) {
          obj[prop] = value;
        }
        if (comp.isInit) kll.rerender = true;
        return true;
      },
    }
  );

  comp.props = props || {};
  if (comp.onstart && !comp.isInit) {
    comp.onstart(p);
  }

  if (comp.onmount) {
    const func = {
      func: comp.onmount,
      state: p,
    };
    if (!kll.onmount.find((o) => JSON.stringify(o) === JSON.stringify(func))) {
      kll.onmount.push(func);
    }
    delete comp.onmount;
  }

  comp.isInit = true;
  comp.render = comp.view({});
  return () => comp.view(p);
}
