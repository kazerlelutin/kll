/**
 * @param {Object | undefined} options - options for set html element
 * @param {string} options.tag - tag of element.
 * @param {string} options.id - id of element.
 * @param {Object} options.attrs - key and value for html attributes.
 * @param {Array} options.classNames - Array with string
 * @param {string | HTMLElement | Array} content - inject content in element
 *
 * @description create a complete HTML element
 * @returns { HTMLElement }
 */
export default function createElement(
  { tag = "div", attrs, classNames, id },
  content
) {
  const el = document.createElement(tag);

  if (attrs && typeof attrs === "object") {
    Object.keys(attrs).forEach((attr) => {
      if (attr.match(/on/)) {
        el.addEventListener(
          `${attr.toLowerCase().replace("on", "")}`,
          attrs[attr]
        );
      } else {
        el.setAttribute(attr, attrs[attr]);
      }
    });
  }
  if (classNames && Array.isArray(classNames)) {
    classNames.forEach((className) => el.classList.add(className));
  } else if (typeof classNames === "string") {
    el.classList.add(classNames);
  }

  if (id) el.setAttribute("id", id);

  if (content && content !== null) {
    const getContent = (elContent) => {
      if (
        typeof elContent === "object" &&
        Object.keys(elContent).includes("kll")
      ) {
        function component(content) {
          const { kll, comp, props } = content;
          const p = new Proxy(
            { ...comp.state },
            {
              set: (obj, prop, value) => {
                if (JSON.stringify(obj[prop]) !== JSON.stringify(value)) {
                  obj[prop] = value;
                }
                kll.reRender = true;
                return true;
              },
            }
          );
          comp.props = props;
          if (comp.onstart) comp.onstart(p);
          return () => comp.view(p);
        }
        return el.appendChild(component(elContent));
      }
      if (typeof elContent === "string") {
        el.innerHTML = elContent;
      } else if (typeof elContent === "function") {
        el.appendChild(elContent());
      } else {
        el.appendChild(elContent);
      }
    };
    if (Array.isArray(content)) {
      content.forEach((c, index) => {
        if (c === null) return;
        if (index > 0 && typeof c === "string") {
          const span = document.createElement("span");
          span.innerText = c;
          return getContent(span);
        } else {
          getContent(c);
        }
      });
    } else {
      getContent(content);
    }
  }

  return el;
}
