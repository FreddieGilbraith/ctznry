import { LitElement, html } from '../../vendor/lit-element/lit-element.js'
import { repeat } from '../../vendor/lit-element/lit-html/directives/repeat.js'
import { emit } from '../lib/dom.js'
import * as gestures from '../lib/gestures.js'
import './button.js'

export class Subnav extends LitElement {
  static get properties () {
    return {
      currentPath: {type: String, attribute: 'current-path'},
      items: {type: Array},
      navClass: {type: String, attribute: 'nav-cls'},
      borderLeft: {type: Number},
      borderWidth: {type: Number}
    }
  }

  createRenderRoot() {
    return this // dont use shadow dom
  }

  constructor () {
    super()
    this.items = []
    this.navClass = ''
    this.currentPath = undefined
    this.borderLeft = undefined
    this.borderWidth = 0
  }
  
  getNavCls ({path, mobileOnly, rightAlign, thin}) {
    return `
      block text-center pt-2 pb-2.5 ${thin ? 'px-3 sm:px-4' : 'px-4 sm:px-7'} whitespace-nowrap font-semibold cursor-pointer
      hov:hover:text-blue-600
      ${mobileOnly ? 'sm:hidden' : ''}
      ${rightAlign ? 'ml-auto' : ''}
      ${path === this.currentPath ? 'text-blue-600' : ''}
    `.replace('\n', '')
  }

  updated (changedProperties) {
    if (changedProperties.has('currentPath') || changedProperties.has('items')) {
      const el = this.querySelector(`a[href="${this.currentPath}"]`)
      if (!el) return
      const rect = el.getClientRects()[0]
      this.borderLeft = el.offsetLeft
      this.borderWidth = rect?.width

      if (this.scrollWidth > this.offsetWidth && el.getBoundingClientRect().left > this.offsetWidth) {
        // we're scrolling horizontally, bring the element into view
        this.scrollLeft = el.offsetLeft
      }
    }
  }

  connectedCallback () {
    super.connectedCallback()
    gestures.setOnSwiping((dx, dxN) => {
      this.borderEl.style.left = `${this.borderLeft + -dxN * this.borderWidth * 0.15}px`
    })
    const rounded = this.navClass.indexOf('round') === -1 ? 'sm:rounded' : ''
    this.className = `
      white-glass sticky top-0 z-10 flex overflow-x-auto bg-white ${rounded} ${this.navClass}
    `
  }

  disconnectedCallback () {
    super.disconnectedCallback()
    gestures.setOnSwiping(undefined)
  }

  setOpaque (b) {
    if (b) this.classList.add('white-glass-opaque')
    else this.classList.remove('white-glass-opaque')
  }

  get borderEl () {
    return this.querySelector('.absolute')
  }

  // rendering
  // =

  render () {
    return html`
      ${typeof this.borderLeft === 'number' ? html`
        <div
          class="absolute bg-blue-600"
          style="
            left: ${this.borderLeft}px;
            bottom: 0;
            width: ${this.borderWidth}px;
            height: 2px;
            transition: left 0.1s;
          "
        ></div>
      ` : ''}
      ${repeat(this.items, item => item.path, item => html`
        <a
          class="${this.getNavCls(item)}"
          href=${item.path}
          @click=${e => this.onClickItem(e, item)}
          style="-webkit-transform: translate3d(0,0,0);"
        >${item.label}</a>
      `)}
    `
    // the webkit-transform style above fixes a rendering issue in safari
  }

  // events
  // =

  onClickItem (e, item) {
    e.preventDefault()
    if (item.click) {
      item.click(e)
    } else if (item.menu) {
      emit(this, 'open-main-menu')
    } else if (item.back) {
      if (window.history.length > 1) {
        window.history.back()
      } else {
        document.body.dispatchEvent(new CustomEvent('navigate-to', {detail: {url: '/', replace: true}}))
      }
    } else {
      emit(this, 'navigate-to', {detail: {url: item.path, replace: true}})
    }
  }
}

customElements.define('app-subnav', Subnav)
