# KLL

*micro framework for render HTML with Javascript.*

*KLL* allows you to generate HTML elements and integrate them into the DOM using a component system.

## Create a component
A component is an **object** that **must** have the `view` key. other keys are optional.

```javascript
const MyComponent = {
    state: /* Object */,
    onstart: /* func */,
    onready: /* Object */
    view: /* func */
}
```
### State
The `state` object has the ability to generate a new DOM if one of its keys is updated.
it can be passed to child components.

```javascript
const MyComponent = {
    state: {
        title:'my super component'
    }
}
```

### View
it is a function. It can take as argument `state`, if it is defined in the object.
```javascript
import {l} from 'kll';
// const {l} = require('kll');

const MyComponent = {
    state: /* Object */,
    onstart: /* func */,
    onmount: /* Object */
    view: /* func */
}


```
### launch function on component is on the Dom

Use `onstart` key.
```javascript

const MyComp = {
  onstart:()=>{
    // write yours func
  },
  view: (state)=> l({},'hello')
}

export k(MyComp) 
```

### launch function on component initialisation

Use `onmount` key. The functions on `onmount` must have a return.
```javascript

const MyComp = {
  onmount:()=>{
    // write yours func
  },
  view: (state)=> l({},'hello')
}

export k(MyComp) 
```

### Export component

#### simple method
Your component can be export with `k` function. 
```javascript
const MyComp = {
view: (state)=> l({},'hello')
}
export k(MyComp) 
```

#### with props method
If you give parent state on your component
```javascript
// import Button component

const MyComp = {
  onstart:()=>{
    MyComp.Button = k(MyButton,MyComp.state)
  },
  view: (state)=> l({},MyComp.Button)
}

export k(MyComp) 
```
