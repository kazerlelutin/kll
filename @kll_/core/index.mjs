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
   * @param {string} [config.ctrlPath='./ctrl/'] - Path to the controllers.
   * @param {string} [config.templatePath='./templates/'] - Path to the templates.
   * @param {KLLPlugin[]} [plugins=[]] - Plugins to be applied to the instance.
   */
  constructor(config) {
    this.id = config.id
    this.routes = config.routes
    this.ctrlPath = config.ctrlPath || "./ctrl/"
    this.templatePath = config.templatePath || "./templates/"
    this.plugins = {}
    const plugins = config.plugins || []

    plugins.forEach((PluginClass) => {
      if (PluginClass.prototype instanceof KLLPlugin) {
        const plugin = new PluginClass(this)
        if (plugin.name) {
          this.plugins[plugin.name] = (...args) => plugin.action(...args)
        } else {
          console.warn(`Plugin ${PluginClass.name} as no name.`)
        }
      } else {
        console.warn(`the plugin ${PluginClass.name} is not a KLLPlugin.`)
      }
    })
    this._init()
  }

  _init() {
    const appElement = document.getElementById(this.id)
    if (!appElement) {
      console.warn(`No element found with id ${this.id}`)
      return
    }
    appElement.routes = this.routes
    this.injectPage()
  }

  parseRoute(href) {
    const route = href || window.location.pathname
    const routeParts = route.split("/")
    const routeKeys = Object.keys(this.routes)
    const params = {}

    const template = routeKeys.reduce((acc, route) => {
      const parts = route.split("/")

      parts.forEach((part, i) => {
        if (part.startsWith(":")) {
          params[part.substring(1)] = routeParts[i]
        } else if (part === routeParts[i]) {
          acc = route
        }
      })
      return acc
    }, "index")

    return { params, template, route }
  }

  /**
   * Injects a specified page based on the provided path.
   * @param {string} path - The path to identify which page to inject.
   */
  async injectPage(path) {
    const { template } = this.parseRoute(path)
    const page = this.routes[template]

    if (page) {
      const appElement = document.querySelector(`#${this.id}`)
      appElement.innerHTML = page
      await this.kllT()
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
    this.cleanUpElement(tElement)
    const attrs = await this.processAttributes(tElement)
    const containerParent = document.createElement("div")
    containerParent.appendChild(attrs.template)
    const container = containerParent.firstElementChild

    container._listeners = {}

    container.state = this.handleInitState(attrs.state, container, attrs.ctrl?.render)

    for (const attr in attrs.attrs) {
      container.setAttribute(attr, attrs.attrs[attr])
    }

    container.kllId = attrs.kllId || `${tElement.getAttribute("kll-t")}_${new Date().getTime()}`
    this.handleAttachMethods(container, attrs.ctrl, container.state)

    container.getState = (id) => KLL.getState(id)

    const slot = container.querySelector("slot")
    if (slot) {
      const children = tElement.firstElementChild || tElement.firstChild
      slot.replaceWith(children)
    }

    tElement.replaceWith(container)
    container?.onInit?.()
  }

  /**
   * Cleans up all event listeners from the given element.
   * @param {HTMLElement} element - The element from which to remove listeners.
   */
  cleanUpElement(element) {
    if (!element?._listeners) return
    Object.keys(element._listeners).forEach((k) => {
      element.removeEventListener(k, element._listeners[k])
    })
    element._listeners = {}
  }

  /**
   * Initializes and attaches the KLL framework to specified elements.
   */
  async kllT() {
    const tEl = document.querySelectorAll("[kll-t]")
    for (const tElement of tEl) {
      await this.hydrate(tElement)
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
  }

  /**
   * Hydrate all elements with the kll-t attribute.
   */
  async kllT() {
    const tEl = document.querySelectorAll("[kll-t]")

    for (const tElement of tEl) {
      await this.hydrate(tElement)
    }
  }

  /**
   * Handles the initialization of state for a component.
   * @param {Object} state - The initial state object for the component.
   * @param {HTMLElement} container - The container element of the component.
   * @param {Function} render - The render function of the component.
   * @returns {Proxy} A proxy object representing the component's state.
   */
  handleInitState(state, container, render) {
    const dependencies = render ? this.getDependencies(render) : null

    return new Proxy(state, {
      set: (target, key, value) => {
        const result = Reflect.set(target, key, value)
        if (dependencies && dependencies.has(key)) {
          container.render(key, value)
        }
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
      element?.render?.({ key, value, name })
    }
  }

  getDependencies(renderFunc) {
    const strRender = renderFunc.toString()
    const regex = /\bstate\.(\w+)|\${state\.(\w+)}|\{(\w+)[^}]*\}\s*=\s*state/g
    let match
    const dependencies = new Set()

    while ((match = regex.exec(strRender)) !== null) {
      dependencies.add(match[1] || match[2] || match[3])
    }

    return dependencies
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
      template: {},
      attrs: {},
      kllId: null,
    }

    for (const attr of tElement.getAttributeNames()) {
      const attrValue = tElement.getAttribute(attr)

      if (attr.startsWith("kll-s")) {
        attrs.state.push({ [attr.slice(6)]: attrValue })
      }
      if (attr === "kll-ctrl") {
        attrs.ctrl = await this.handleControllerAttribute(attrValue)
      } else if (attr === "kll-t") {
        attrs.template = await this.handleTemplate(attrValue)
      } else if (attr === "kll-id") {
        attrs.kllId = attrValue
        attrs.attrs["kll-id"] = attrValue
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

  /**
   * Handles importing and processing of the specified template.
   * @param {string} templateName - The name of the template to import and process.
   * @returns {HTMLElement} The first child of the container with the processed template.
   */
  async handleTemplate(templateName) {
    let raw = null
    try {
      const nameAndfolder = templateName.replace(".", "/")
      const path = nameAndfolder.startsWith("/") ? nameAndfolder.slice(1) : nameAndfolder
      const completePath = `${this.templatePath}${path}.html?raw`
      raw = await import(/* @vite-ignore */ completePath)
    } catch (e) {
      throw new Error(`Template ${templateName} not found`)
    }
    const el = document.createElement("div")
    el.innerHTML = raw.default

    const name = templateName.split(".").pop()

    const template = el.querySelector(`#${name}`).content
    const componentInstance = document.importNode(template, true)
    const container = document.createElement("div")
    container.appendChild(componentInstance)

    return container.firstElementChild
  }

  /**
   * Handles importing and processing of the specified controller.
   * @param {string} attrValue - The value of the controller attribute to import and process.
   * @returns {Object} The imported controller module.
   */
  async handleControllerAttribute(attrValue) {
    let ctrlImp = null

    const name = attrValue.split(".").pop()

    try {
      const nameAndfolder = attrValue.replace(".", "/")
      const path = nameAndfolder.startsWith("/") ? nameAndfolder.slice(1) : nameAndfolder

      const completePath = `${this.ctrlPath}${path}.js`

      ctrlImp = await import(/* @vite-ignore */ completePath)
    } catch (e) {
      throw new Error(`Controller ${attrValue} not found`)
    }

    if (!ctrlImp.default && !ctrlImp[name]) {
      throw new Error(`Controller ${attrValue} not found`)
    }

    return ctrlImp.default || ctrlImp[name]
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
}
