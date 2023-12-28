import { KLLPlugin } from "@kll_/core"
export class TranslatePlugin extends KLLPlugin {
  /**
   * Constructs an instance of TranslatePlugin.
   * @param {KLL} kllInstance - The KLL instance that the plugin will be attached to.
   * @param {Object} translationData - The translation data to be used by the plugin.
   */
  constructor(kllInstance, translationData) {
    super(kllInstance)
    this.name = "translate"
    this.translation = translationData || {}
  }

  /**
   * Translates the page or specific elements based on provided translation data.
   * @param {Element|null} elementToTranslate - The element to translate, or null to translate the whole document.
   * @returns {void}
   */
  action(elementToTranslate) {
    const lang = getLang()

    const elToTranslate = elementToTranslate
      ? elementToTranslate.querySelectorAll("[data-trans]")
      : document.querySelectorAll("[data-trans]")
    const placeholderToTranslate = elementToTranslate
      ? elementToTranslate.querySelectorAll("[placeholder]")
      : document.querySelectorAll("[placeholder]")
    elToTranslate.forEach((el) => {
      const key = el.getAttribute("data-trans")
      const count = el.getAttribute("data-trans-count")
      const finalKey = count > 1 ? `${key}_multi` : key
      let trans = translation?.[finalKey]?.[lang] || key
      if (count) trans = trans.replace("{{count}}", count)
      el.innerHTML = trans
    })

    placeholderToTranslate.forEach((el) => {
      const key = el.getAttribute("placeholder")
      const trans = translation?.[key]?.[lang] || key
      el.setAttribute("placeholder", trans)
    })

    return newEl
  }
}
