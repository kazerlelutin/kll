import { KLLPlugin } from "@kll_/core"
export class TranslatePlugin extends KLLPlugin {
  /**
   * Constructs an instance of TranslatePlugin.
   * @param {KLL} kllInstance - The KLL instance that the plugin will be attached to.
   * @param {Object} translationData - The translation data to be used by the plugin.
   */
  constructor(kllInstance, translationData, lsKey = "__kll__lang") {
    super(kllInstance)
    this.lang = "en"
    this.lsKey = lsKey
    this.name = "translate"
    this.translation = translationData || {}
  }

  /**
   * Translates the page or specific elements based on provided translation data.
   * @param {Element|null} elementToTranslate - The element to translate, or null to translate the whole document.
   * @returns {void}
   */

  getLang() {
    const lang = localStorage.getItem(this.lsKey) || "en"
    this.lang = lang
    return lang
  }

  setLang(lang) {
    localStorage.setItem(this.lsKey, lang)
    this.lang = lang
  }
  action(elementToTranslate) {
    const lang = this.getLang()

    // Détermine les éléments à traduire
    const elementsToTranslate = elementToTranslate
      ? [elementToTranslate].concat(Array.from(elementToTranslate.querySelectorAll("[data-trans]")))
      : document.querySelectorAll("[data-trans]")
    const placeholdersToTranslate = elementToTranslate
      ? [elementToTranslate].concat(
          Array.from(elementToTranslate.querySelectorAll("[placeholder]"))
        )
      : document.querySelectorAll("[placeholder]")

    // Traduit les éléments avec l'attribut 'data-trans'
    elementsToTranslate.forEach((el) => {
      if (el.hasAttribute("data-trans")) {
        const key = el.getAttribute("data-trans")
        const count = el.getAttribute("data-trans-count")
        const finalKey = count > 1 ? `${key}_multi` : key
        let trans = this.translation?.[finalKey]?.[this.lang] || key
        if (count) trans = trans.replace("{{count}}", count)
        el.innerText = trans
      }
    })

    // Traduit les éléments avec l'attribut 'placeholder'
    placeholdersToTranslate.forEach((el) => {
      if (el.hasAttribute("placeholder")) {
        const key = el.getAttribute("placeholder")
        const trans = this.translation?.[key]?.[lang] || key
        el.setAttribute("placeholder", trans)
      }
    })

    return elementToTranslate
  }
}
