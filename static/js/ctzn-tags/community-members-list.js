import { LitElement, html } from '../../vendor/lit-element/lit-element.js'
import { repeat } from '../../vendor/lit-element/lit-html/directives/repeat.js'
import { intersect } from '../lib/functions.js'
import * as session from '../lib/session.js'
import { AVATAR_URL } from '../lib/const.js'
import '../com/members-list.js'

export class CommunityMembersList extends LitElement {
  static get properties () {
    return {
      userId: {type: String, attribute: 'user-id'},
      members: {type: Array},
      roles: {type: Array},
      followedMembers: {type: Array},
      isExpanded: {type: Boolean}
    }
  }

  createRenderRoot() {
    return this // dont use shadow dom
  }

  constructor () {
    super()
    this.view = undefined
    this.userId = undefined
    this.members = undefined
    this.canBan = undefined
    this.followedMembers = undefined
    this.isExpanded = false
    this.setAttribute('ctzn-elem', '1')
  }

  setContextState (state) {
    if (state?.page?.userId) {
      if (!this.userId) {
        this.userId = state.page.userId
      }
    }
  }

  updated (changedProperties) {
    if (changedProperties.has('userId') && this.userId !== changedProperties.get('userId')) {
      this.load()
    }
  }

  async load () {
    this.isExpanded = false
    this.members = undefined
    this.followedMembers = undefined
    this.canBan = undefined

    const members = await session.ctzn.listAllMembers(this.userId)
    members.sort((a, b) => b.value.joinDate.localeCompare(a.value.joinDate))
    this.members = members
    if (session.isActive() && this.userId !== session.info.userId) {
      this.followedMembers = intersect(
        session.myFollowing,
        this.members.map(m => m.value.user.userId)
      )
      if (this.amIAMember) {
        let perm = await session.ctzn.getCommunityUserPermission(
          this.userId,
          session.info.userId,
          'ctzn.network/perm-community-ban'
        )
        this.canBan = !!perm
      } else {
        this.canBan = false
      }
    }
  }

  get amIAMember () {
    return session.isActive() && !!this.members?.find?.(m => m.value.user.userId === session.info.userId)
  }

  // rendering
  // =

  render () {
    if (typeof this.members === 'undefined') {
      return html`
        <div class="bg-white sm:rounded my-1 px-5 py-3">
          <span class="text-lg font-medium mr-1">Members</span>
          <span class="spinner text-gray-500"></span>
        </div>
      `
    }
    return html`
      <div class="bg-white sm:rounded my-1 ${this.members ? 'pb-1' : ''}">
        <div
          class="px-5 py-3 sm:rounded ${this.members?.length ? 'cursor-pointer hov:hover:text-blue-600' : ''}"
          @click=${this.members?.length ? this.onToggleExpanded : undefined}
        >
          <div class="flex items-center justify-between">
            <span>
              <span class="text-lg font-medium mr-1">Members</span>
              <span class="text-gray-500 font-bold">${this.members?.length || '0'}</span>
            </span>
            ${this.members?.length ? html`
              <span class="fas fa-angle-${this.isExpanded ? 'up' : 'down'}"></span>
            ` : ''}
          </div>
          ${this.followedMembers?.length ? html`
            <div class="py-1 flex items-center text-gray-500">
              <span class="mr-2">Followed:</span>
              ${repeat(this.followedMembers.slice(0, 7), (userId, i) => html`
                <span data-tooltip=${userId}>
                  <img src=${AVATAR_URL(userId)} class="inline-block rounded-md w-7 h-7 mr-1">
                </span>
              `)}
              ${this.followedMembers.length > 7 ? html`<span class="font-semibold ml-1">+${this.followedMembers.length - 7}</span>` : ''}
            </div>
          ` : ''}
        </div>
        ${this.isExpanded ? html`
          <div class="sm:mx-2 mb-1 sm:rounded px-1 py-1 bg-gray-100">
            <app-members-list
              .members=${this.members}
              ?canban=${this.canBan}
              @ban=${this.onBan}
            ></app-members-list>
          </div>
        ` : ''}
      </div>
    `
  }

  // events
  // =

  onToggleExpanded (e) {
    this.isExpanded = !this.isExpanded
  }
}

customElements.define('ctzn-community-members-list', CommunityMembersList)