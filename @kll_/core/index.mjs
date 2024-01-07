/**
 * Base class for all KLL plugins. Plugins should extend this class and define a name and an action.
 */
export class KLLPlugin {
  /**
   * Constructs an instance of a KLL plugin.
   * @param {KLL} kllInstance - The KLL instance that the plugin will be attached to.
   */
  constructor(kllInstance) {
    /**
     * @type {KLL}
     * @description The KLL instance that the plugin is attached to.
     */
    this.kll = kllInstance

    /**
     * @type {string}
     * @description The name under which the plugin's action will be attached to the KLL instance.
     */
    this.name = ""
  }

  /**
   * Applies the plugin's action to the KLL instance.
   */
  apply() {
    if (this.name && typeof this.action === "function") {
      this.kll[this.name] = this.action.bind(this)
    } else {
      console.warn(
        `action is not a function or name is not defined for plugin ${this.constructor.name}`
      )
    }
  }

  /**
   * The action method of the plugin, which should be overridden by subclasses.
   */
  action() {
    console.warn("the plugin action is not defined")
  }
}

/**
 * Main class of the KLL framework managing initialization, plugins, and hydration.
 */
export class KLL {
  /**
   * Constructs an instance of KLL.
   * @param {Object} config - The configuration for the KLL instance.
   * @param {string} config.id - The ID of the root element.
   * @param {Object} config.routes - The routes for the application.
   * @param {KLLPlugin[]} [plugins=[]] - Plugins to be applied to the instance.
   */
  constructor(config) {
    this.id = config.id
    this.routes = {}
    this.routesAsync = config.routes
    this.cleanupCollection = []
    this.plugins = {}
    const plugins = config.plugins || []
    this.initialize = false
    this.ctrlPath = config.ctrlPath || undefined
    this.templatePath = config.templatePath || undefined
    this.initsIds = []

    plugins.forEach((PluginClass) => {
      const plugin =
        PluginClass.prototype instanceof KLLPlugin ? new PluginClass(this) : PluginClass()
      if (plugin.name) {
        this.plugins[plugin.name] = (...args) => plugin.action(...args)
      } else {
        console.warn(`Plugin ${PluginClass.name} as no name.`)
      }
    })

    this._init()
  }

  async _init() {
    const appElement = document.getElementById(this.id)
    if (!appElement) {
      console.warn(`No element found with id ${this.id}`)
      return
    }
    appElement.routes = this.routes

    await this.injectPage()

    window.addEventListener("popstate", () => {
      this.injectPage()
    })
  }

  parseRoute(href) {
    const route = href || window.location.pathname

    const routeParts = route.split("/").splice(1)
    const routeKeys = Object.keys(this.routesAsync)
    const params = {}

    const template = routeKeys.reduce((acc, route) => {
      const parts = route.split("/").splice(1)

      if (parts.length !== routeParts.length) return acc
      parts.forEach((part, i) => {
        if (part.startsWith(":")) {
          params[part.substring(1)] = routeParts[i]
        } else if (part === routeParts[i]) {
          acc = route
        }
      })
      return acc
    }, "/")

    return { params, template, route }
  }

  /**
   * Injects a specified page based on the provided path.
   * @param {string} path - The path to identify which page to inject.
   */
  async injectPage(path) {
    this.initsIds = []
    if (!this.initialize) {
      //Cache the entryPoint
      if (this.routesAsync["/"]) {
        this.routes["/"] = await this.routesAsync["/"]
      }
    }

    this.initialize = true
    const { template } = this.parseRoute(path)

    let page = this.routes[template]

    if (!page) {
      page = await this.routesAsync[template]
      this.routes[template] = page
    }

    const appElement = document.querySelector(`#${this.id}`)

    this.cleanUp()
    if (page) {
      appElement.innerHTML = page
      await this.hydrateNestedComponents(this.sanitizeElement(appElement))
    } else {
      const keys = Object.keys(this.routes)
      appElement.innerHTML = this.routes[keys[0]]
    }
  }

  /**
   * Retrieves the state of a component with the specified ID.
   * @param {string} id - The unique identifier for the component.
   * @returns {Object} The state object of the component or an empty object if not found.
   */
  static getState(id) {
    const el = document.querySelector(`[kll-id='${id}']`)
    return el?.state || {}
  }

  /**
   * Hydrates a given element with the necessary attributes and state.
   * @param {HTMLElement} tElement - The element to hydrate.
   */
  async hydrate(tElement) {
    this.sanitizeElement(tElement)
    this.cleanUpElement(tElement)
    let kllId = tElement.getAttribute("kll-id")

    if (!kllId) {
      const t = tElement.getAttribute("kll-t")
      const c = tElement.getAttribute("kll-c")
      const tc = tElement.getAttribute("kll-tc")
      const ctrl = tElement.getAttribute("kll-ctrl")

      if (t && ctrl) {
        kllId = `${t}_${ctrl}`
      } else if (c) {
        kllId = c
      } else if (tc) {
        kllId = tc
      } else if (t) {
        kllId = t
      } else if (ctrl) {
        kllId = ctrl
      }
    }
    // Protection contre les multiples initialisations (nested components)
    if (this.initsIds.includes(kllId)) return

    // Raccourci pour la création de composants avec un contrôleur et un template au nom identique.
    if (tElement.getAttribute("kll-tc")) {
      const value = tElement.getAttribute("kll-tc")
      tElement.setAttribute("kll-t", value)
      tElement.setAttribute("kll-ctrl", value)
      tElement.removeAttribute("kll-tc")
    }

    const attrs = await this.processAttributes(tElement)

    const containerParent = document.createElement("div")
    if (attrs?.template) containerParent.appendChild(attrs.template)
    const container = attrs.template ? containerParent.firstElementChild : tElement

    for (const attr in attrs.attrs) {
      container.setAttribute(attr, attrs.attrs[attr])
    }

    if (this.initsIds.includes(container.kllId)) return

    container._listeners = {}
    // Initialise l'état et attache les méthodes du contrôleur.
    container.state = this.handleInitState(attrs.state, container, attrs.ctrl?.render)

    // Initialise l'ID du composant et l'attache à l'élément.
    container.kllId = kllId
    container.setAttribute("kll-id", kllId)

    this.handleAttachMethods(container, attrs.ctrl, container.state)

    container.getState = (id) => KLL.getState(id)

    // Gère les éléments enfants si un slot est défini.
    if (container.querySelector("slot")) {
      const slot = container.querySelector("slot")
      const el = document.createElement("div")
      el.innerHTML = tElement.innerHTML
      slot.innerHTML = ""
      slot.replaceWith(el.firstElementChild ? el.firstElementChild : el.innerHTML)
    }

    // Remplace l'élément original si un template est utilisé.
    if (attrs.template) {
      tElement.replaceWith(container)
      await this.hydrateNestedComponents(this.sanitizeElement(container)) // Hydrater les composants imbriqués
    }

    // Appelle la méthode onInit si elle est définie. Previent les appels multiples.
    container?.onInit?.()
    this.initsIds.push(container.kllId)
  }

  async hydrateNestedComponents(element) {
    const nestedComponents = element.querySelectorAll("[kll-t], [kll-ctrl], [kll-tc]")
    for (const nested of nestedComponents) {
      await this.hydrate(nested)
    }
  }

  /**
   * Remove all event listeners from the given element.
   * @param {HTMLElement} element - The element from which to remove listeners.
   */
  cleanUpElement(element) {
    if (!element?._listeners) return
    Object.keys(element._listeners).forEach((k) => {
      element.removeEventListener(k, element._listeners[k])
    })
    element._listeners = {}
    element?.cleanUp?.()
  }

  cleanUp() {
    this.initsIds = []
    this.cleanupCollection.forEach((el) => {
      el?.()
    })
    this.cleanupCollection = []
  }

  /**
   * Handles the initialization of state for a component.
   * @param {Object} state - The initial state object for the component.
   * @param {HTMLElement} container - The container element of the component.
   * @param {Function} render - The render function of the component.
   * @returns {Proxy} A proxy object representing the component's state.
   */
  handleInitState(state, container, render) {
    return new Proxy(state, {
      set: (target, key, value) => {
        const result = Reflect.set(target, key, value)
        render(container.state, container, { name: container.kllId, key, value })
        this.handleTriggerState(key, value, container.kllId)
        return result
      },
    })
  }

  /**
   * Triggers state updates for specified elements.
   * @param {string} key - The state key that has been changed.
   * @param {any} value - The new value of the state key.
   * @param {string} name - The name of the component whose state has changed.
   */
  async handleTriggerState(key, value, name) {
    const elements = document.querySelectorAll(`[kll-b*='${name}.${key}']`)
    for (const element of elements) {
      const proxy = { key, value, name }
      element?.cleanUp?.(proxy)
      element?.render?.(proxy)
    }
  }

  /**
   * Extracts and processes attributes from a given element.
   * @param {HTMLElement} tElement - The element from which to extract attributes.
   * @returns {Object} An object containing processed attributes.
   */
  async processAttributes(tElement) {
    const attrs = {
      state: [],
      ctrl: {},
      template: undefined,
      attrs: {},
      kllId: null,
    }

    for (const attr of tElement.getAttributeNames()) {
      const attrValue = tElement.getAttribute(attr)

      if (attr.startsWith("kll-s")) {
        attrs.state.push({ [attr.slice(6)]: attrValue })
      }
      if (attr === "kll-ctrl") {
        attrs.ctrl = await this.processCtrl(attrValue)
      } else if (attr === "kll-t") {
        attrs.template = await this.processTemplate(attrValue)
      }

      if (!attr.startsWith("kll-") || attr === "kll-b") {
        attrs.attrs[attr] = attrValue
      }
    }

    if (attrs.ctrl.state) {
      // ceux qui proviennent du ctrl ne sont pas  prioritaires, ils seront écrasés par ceux qui proviennent de l'attribut kll-s
      attrs.state = [
        ...Object.keys(attrs.ctrl.state).map((k) => ({ [k]: attrs.ctrl.state[k] })),
        ...attrs.state,
      ]
    }

    attrs.state = attrs.state.reduce((acc, curr) => {
      return { ...acc, ...curr }
    }, {})
    return attrs
  }

  async processTemplate(name) {
    const templates = await this.templatePath
    const template = templates[name]

    if (!template) return console.warn(`No template found with name ${name}`)
    const el = document.createElement("div")

    el.innerHTML = template.default

    const container = el.querySelector(`#${name}`).content
    const componentInstance = document.importNode(container, true)
    const containerParent = document.createElement("div")
    containerParent.appendChild(componentInstance)
    return this.sanitizeElement(containerParent.firstElementChild)
  }

  async processCtrl(name) {
    const ctrls = await this.ctrlPath
    return ctrls[name]
  }

  /**
   * Attaches methods and listeners to the container based on the provided controller.
   * @param {HTMLElement} container - The container element to which to attach methods.
   * @param {Object} ctrl - The controller object containing methods to attach.
   * @param {Object} state - The state object of the component.
   */
  handleAttachMethods(container, ctrl, state) {
    const methods = Object.keys(ctrl)
      .filter((k) => k.startsWith("on"))
      .filter((k) => !k.match(/state|oninit/i))

    if (ctrl.render) {
      container.render = (proxy) => ctrl.render(state, container, proxy)
    }

    if (ctrl.onInit) {
      container.onInit = () => ctrl.onInit(state, container)
    }

    if (ctrl.cleanUp) {
      container.cleanUp = this.cleanupCollection.push(() => ctrl.cleanUp(state, container))
      container.cleanUp = (proxy) => ctrl.cleanUp(state, container, proxy)
    }

    for (const method of methods) {
      const methodType = method.slice(2).toLocaleLowerCase()

      const helper = (e) => {
        if (typeof ctrl[method] === "function") {
          ctrl[method](state, e.target, e)
        } else {
          console.warn(`Method ${methodType} is not defined on the controller.`)
        }
      }
      container._listeners[methodType] = helper
      container.addEventListener(methodType, helper)
    }
  }

  /**
   * Registers a plugin to the KLL instance.
   * @param {string} pluginName - The name under which to register the plugin.
   * @param {KLLPlugin} plugin - The plugin to register.
   */
  registerPlugin(pluginName, plugin) {
    this.plugins[pluginName] = plugin
  }

  sanitizeElement(element) {
    // Supprimer tous les éléments script
    const scripts = element.querySelectorAll("script")
    scripts.forEach((script) => script.remove())

    // Supprimer tous les attributs commençant par 'on'
    const allElements = element.querySelectorAll("*")
    allElements.forEach((el) => {
      ;[...el.attributes].forEach((attr) => {
        const regex = /<script|<ifr|<em|<img|javascript:/i.test(attr.value)
        if (attr.name.startsWith("on") || regex) {
          console.warn(`Attribute ${attr.name} removed from element ${el.tagName}, possible XSS.`)
          el.removeAttribute(attr.name)
        }
      })
    })
    return element
  }
}
