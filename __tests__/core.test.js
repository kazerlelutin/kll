import { KLL } from "../@kll_/core/index.mjs"
import { beforeEach, afterEach, describe, it } from "node:test"
import { JSDOM } from "jsdom"
import assert from "node:assert"

const baseConfig = {
  id: "app",
  ctrlPath: "../../__tests__/__ctrl__",
  templatePath: "../../__tests__/__templates__",
  routes: {
    "/": "<div>Home</div>",
  },
}

describe("========== KLL CORE ==========", () => {
  beforeEach(async () => {
    const dom = new JSDOM(`<div id="app">__</div>`, { url: "http://localhost/" })

    global.window = dom.window
    global.window = dom.window
    global.document = dom.window.document
    global.window = dom.window
  })

  afterEach(() => {
    delete global.window
    delete global.document
  })

  it("Initialise class", async () => {
    const kll = new KLL(baseConfig)

    assert(kll instanceof KLL)
    assert(kll.routes instanceof Object)
    assert(kll.routes["/"] === "<div>Home</div>")
  })

  it("Page render", async () => {
    const config = {
      ...baseConfig,
      routes: {
        "/": "<div id='home'>Home</div>",
      },
    }

    const kll = new KLL(config)

    await kll._init()

    assert.strictEqual(document.querySelector("#home").outerHTML, '<div id="home">Home</div>')
  })

  it("Simple Controller with render", async () => {
    const config = {
      ...baseConfig,
      routes: {
        "/": "<div kll-ctrl='foo' id='home'>Home</div>",
      },
    }

    const kll = new KLL(config)

    await kll._init()

    assert.strictEqual(
      document.querySelector("#home").outerHTML,
      '<div kll-ctrl="foo" id="home"><h1>Foo</h1></div>'
    )
  })
})
