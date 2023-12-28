import { KLLPlugin } from "@kll_/core"

export class CreateComponentPlugin extends KLLPlugin {
  constructor(kllInstance) {
    super(kllInstance)
    this.name = "createComponent"
  }

  /**
   * Creates a new component with the specified parameters and hydrates it.
   * @param {string} templateName - The name of the template to use.
   * @param {string} ctrlName - The name of the controller to bind.
   * @param {string} id - The unique identifier for the new component.
   * @param {Object} stateAttrs - Initial state attributes for the component.
   * @returns {HTMLElement} The newly created and hydrated DOM element.
   */
  action(templateName, ctrlName, id, stateAttrs = {}) {
    const newEl = document.createElement("div")

    newEl.setAttribute("kll-t", templateName)
    newEl.setAttribute("kll-ctrl", ctrlName)
    newEl.setAttribute("kll-id", id)

    for (const [key, value] of Object.entries(stateAttrs)) {
      newEl.setAttribute(`kll-s-${key}`, value)
    }

    this.kll.hydrate(newEl)

    return newEl
  }
}
