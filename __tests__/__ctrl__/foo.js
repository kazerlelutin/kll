export const foo = {
  onInit(_, el) {
    el.render()
  },
  render(_, el) {
    el.innerHTML = `<h1>Foo</h1>`
  },
}
