# ALPHA !!!

Warning: there is possible lot of bug and breaking changes. you can open a issue for help.

# KLL

KLL is a lightweight, extensible JavaScript framework for building dynamic web applications. It offers a simple plugin system, easy state management, and an intuitive templating system.

## Features

- **Simple Plugin System**: Extend the framework's capabilities with custom plugins.
- **Dynamic Templating**: Easily define and hydrate templates with your data.
- **State Management**: Manage your application's state effectively and reactively.

## Getting Started

To get started with KLL, you need to include it in your project. You can clone it from the repository or use a package manager if it's published.

```bash
git clone https://github.com/your-username/kll-framework.git
```

Creating a comprehensive README is essential for any library or framework as it's often the first place users go for information. Here's a structured README for your KLL library and TranslatePlugin:

markdownCopy code

# KLL Framework

KLL is a lightweight, extensible JavaScript framework for building dynamic web applications. It offers a simple plugin system, easy state management, and an intuitive templating system.

## Features

- **Simple Plugin System**: Extend the framework's capabilities with custom plugins.
- **Dynamic Templating**: Easily define and hydrate templates with your data.
- **State Management**: Manage your application's state effectively and reactively.

## Getting Started

To get started with KLL, you need to include it in your project. You can clone it from the repository or use a package manager if it's published.

```bash
git clone https://github.com/your-username/kll-framework.git

```

### Basic Usage

Here's how you can set up a simple KLL application:

```javascript
import { KLL } from "@kll_/core"
import * as ctrl from "./ctrl"
import * as templates from "./templates"

// Define your routes and templates
const config = {
  id: "app",
  routes: {
    /* ...your routes... */
  },
  ctrl,
  template,
  plugins: [
    /* ...your plugins... */
  ],
}

// Initialize KLL
const app = new KLL(config)
```

### Managing Component Lifecycle with cleanUp

In the KLL framework, each component can have a `cleanUp` function defined in its controller. This function is designed to be called before the component is re-rendered or before the DOM is updated. It provides a way to perform necessary cleanup operations, like unsubscribing from events or deallocating resources, to prevent memory leaks and other issues.

#### Defining a cleanUp Function

In your component's controller, define a `cleanUp` method. This method can optionally receive information about the trigger (similar to the `render` method) if the cleanup operations depend on how the component is being updated.

```javascript
export const myComponent = {
  // ... other properties ...

  // Define a cleanUp function
  cleanUp(state, el, trigger) {
    // Perform cleanup tasks here
    // For example, remove event listeners, cancel timers, etc.
    if (trigger && trigger.name === "someName") {
      // Specific cleanup based on the trigger
    }
    console.log("Cleaning up before re-rendering or updating DOM")
  },

  render(state, el, trigger) {
    // Rendering logic here
    // ...
  },
}
```

In the above example, the cleanUp function is defined to perform tasks before the component is updated. It's particularly useful for removing event listeners, canceling timeouts/intervals, or handling any other teardown logic necessary to clean up the previous state of the component.

How cleanUp is Executed
The KLL framework will automatically call the cleanUp function in the following scenarios:

Before Re-rendering: If the component needs to be re-rendered due to state changes or other updates, cleanUp is called before the new render to ensure a clean slate.
Before DOM Updates: If the DOM is about to be updated and the component is involved, cleanUp provides an opportunity to perform any necessary teardown operations.
This lifecycle hook ensures that components can manage their resources efficiently, avoiding common pitfalls like memory leaks and zombie event listeners.

Use Cases for cleanUp
Event Listeners: Remove event listeners attached to global objects or DOM elements.
Timers: Clear any timeouts or intervals that shouldn't persist beyond the life of the component.
Subscriptions: Unsubscribe from shared state, observables, or other forms of communication.
DOM Manipulations: Revert any direct DOM manipulations performed by the component.

## Plugins

KLL's power comes from its extensibility through plugins. Here's how you can create a basic plugin:

```javascript
import { KLLPlugin } from "path-to-kll/KLL"

class MyPlugin extends KLLPlugin {
  constructor(kllInstance) {
    super(kllInstance)
    this.name = "myPlugin"
  }

  action() {
    // Your plugin's functionality
  }
}
```

## Usage

To get started with the KLL framework, here's a step-by-step guide using the provided examples.

### 1. Setting Up Your HTML

Create an HTML file and include the necessary KLL framework and your component scripts. Here's a simple example:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>KLL Example</title>
    <!-- Include your CSS here -->
  </head>
  <body>
    <div>
      <h1>Hello KLL!</h1>
      <div
        kll-t="button-count"
        kll-ctrl="buttonCount"
        kll-s-word="salut ceci vient d'une props"
        data-trans="test"
        kll-id="my_button"
      ></div>

      <div kll-t="textToRender" kll-b="truc.rien,my_button.count" kll-ctrl="textToRender"></div>

      <div kll-t="withChildren">
        <div>hello, children</div>
      </div>
      <div kll-t="inception" kll-ctrl="inception" kll-b="inception_button.count"></div>
      <div kll-t="button" kll-ctrl="button">Button in folder "ui"</div>
    </div>

    <!-- Include KLL and components scripts here -->
  </body>
</html>
```

**KLL-TC**:
Simple syntax (if template and controller have same name)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>KLL Example</title>
    <!-- Include your CSS here -->
  </head>
  <body>
    <div kll-tc="buttonCount"></div>
    <!-- Include KLL and components scripts here -->
  </body>
</html>
```

2. Creating Templates
   Create a template file for your components. For example, here's how you might define the button-count template:

```html
<template id="buttonCount">
  <button class="border border-white m-2" type="button"></button>
</template>
```

3. Writing Controllers
   Controllers define the behavior of your components. Here's an example controller for the button-count template:

```javascript
export const buttonCount = {
  state: {
    text: "Hello World",
    count: 0,
  },
  onInit(_state, el) {
    el.render()
  },
  onclick(state, _el) {
    state.count++
  },
  render(state, el) {
    el.innerHTML = `clicks: ${state.count}`
  },
}
```

4. Implementing Other Components
   Similarly, you can implement other components like textToRender with its template and controller.
   This component render the previous button count.

```html
<template id="textToRender">
  <div>
    <h2>Render</h2>
    <p>the count of button: <span data-count>0</span></p>
  </div>
</template>
```

```javascript
export const textToRender = {
  //Trigger give info from element and key triggered by change of state
  // { name: "name of component" , key, value}
  render(_state, el, trigger) {
    // You have access to
    console.log("info from trigger:", trigger)
    const countEl = el.querySelector("[data-count]")
    const btnState = el.getState("my_button")
    countEl.innerHTML = btnState.count
  },
}
```

In Your Page

```HTML
<!--Kll-b listen key "bar" on element "foo" and "count" on element "my_button" -->
  <div kll-t="textToRender" kll-b="foo.bar,my_button.count" kll-ctrl="textToRender"></div>
```

## Plugin

### Exemple with @kll\_/basic

The `@kll_/basic` package provides core functionality for the KLL framework, including the ability to dynamically create and hydrate components. One such utility is the `createComponent` function, made available through a plugin, which allows you to create new elements from templates and hydrate them with state before mounting them into the DOM.

#### Installation

First, install the package using npm:

```bash
npm install @kll_/basic
```

Declare the plugin

```javascript
import { KLL } from "path-to-kll/KLL"
import { CreateComponentPlugin } from "@kll_/basic"
// Define your routes and templates
const config = {
  id: "app",

  // ....
  plugins: [CreateComponentPlugin],
}

// Initialize KLL
const app = new KLL(config)
```

Using the createComponent Function
Below is an example of how you might use the createComponent function within a KLL component controller:

```javascript
export const inception = {
  onInit(_state, el) {
    el.render()
  },
  async render(state, el, listen) {
    if (listen) {
      const { name, key, value } = listen
      if (name === "inception_button" && key === "count") {
        const countEl = el.querySelector("[data-async-count]")
        countEl.innerHTML = value
        return
      }
    }

    const asyncEl = el.querySelector("[data-async]")
    setTimeout(() => {
      asyncEl.replaceWith(
        kll.plugins.createComponent("button-count", "buttonCount", "inception_button", {
          count: 10,
        })
      )
      asyncEl.innerHTML = `clicks: ${state.count}`
    }, 1000)
  },
}
```

In this example, the inception component uses the createComponent function to dynamically insert a new "button-count" component into the DOM after a 1-second delay. The new component is fully reactive and integrated with the KLL framework's state management system. This demonstrates the power and flexibility of the @kll\_/basic package when creating dynamic, interactive web applications.
