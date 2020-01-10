import { Component, Element, Method, Prop, State, Watch, h } from '@stencil/core';
import PopperJs from 'popper.js';

let id = 0;

@Component({
  tag: 's-dropdown',
  styleUrl: 'dropdown.scss',
  scoped: true
})
export class Dropdown {
  id = `s-dropdown-${++id}`;
  menu: HTMLElement;
  popper: PopperJs;
  trigger: HTMLElement;

  constructor() {
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    this.handleDocumentKeyDown = this.handleDocumentKeyDown.bind(this);
    this.handleMenuMouseDown = this.handleMenuMouseDown.bind(this);
    this.handleMenuMouseOver = this.handleMenuMouseOver.bind(this);
    this.handleMenuMouseOut = this.handleMenuMouseOut.bind(this);
    this.handleTransitionEnd = this.handleTransitionEnd.bind(this);
  }

  @Element() host: HTMLElement;

  @State() isOpen = false;

  /**
   * The preferred placement of the dropdown menu. Note that the actual placement may vary as needed to keep the menu
   * inside of the viewport.
   */
  @Prop() placement: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' = 'bottom-start';

  @Watch('placement')
  handlePlacementChange() {
    if (this.popper) {
      this.popper.options.placement = this.placement;
    }
  }

  componentDidLoad() {
    this.popper = new PopperJs(this.trigger, this.menu, {
      placement: this.placement,
      modifiers: {
        offset: {
          offset: '0, 2px'
        }
      }
    });
  }

  componentDidUnload() {
    if (this.popper) {
      this.popper.destroy();
    }
  }

  @Method()
  async open() {
    this.menu.hidden = false;
    this.isOpen = true;
    this.popper.scheduleUpdate();
    this.closeOtherDropdowns();

    document.addEventListener('click', this.handleDocumentClick);
    document.addEventListener('keydown', this.handleDocumentKeyDown);
  }

  @Method()
  async close() {
    this.isOpen = false;
    this.setSelectedItem(null);

    document.removeEventListener('click', this.handleDocumentClick);
    document.removeEventListener('keydown', this.handleDocumentKeyDown);
  }

  closeOtherDropdowns() {
    [...document.querySelectorAll('s-dropdown')].map(dropdown => {
      if (this.host !== dropdown) {
        dropdown.close();
      }
    });
  }

  getAllItems() {
    return [...this.menu.querySelectorAll('s-dropdown-item:not([disabled])')] as [HTMLSDropdownItemElement];
  }

  getSelectedItem() {
    return this.getAllItems().find(i => i.active);
  }

  setSelectedItem(item: HTMLSDropdownItemElement) {
    this.getAllItems().map(i => (i.active = i === item));
  }

  handleDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const dropdown = target.closest('s-dropdown');
    const dropdownItem = target.closest('s-dropdown-item');

    // Close when clicking outside of the dropdown control
    if (!dropdown) {
      this.close();
      return;
    }

    // Close when clicking on a dropdown item
    if (dropdownItem && !dropdownItem.disabled) {
      this.close();
      return;
    }
  }

  handleDocumentKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' || event.key === 'Tab') {
      this.close();
    }

    if (event.key === 'Enter') {
      const item = this.getSelectedItem();
      event.preventDefault();

      if (item && !item.disabled) {
        item.click();
        this.close();
      }
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!this.isOpen) {
        this.open();
      } else {
        const items = this.getAllItems();
        const selectedItem = this.getSelectedItem();
        event.preventDefault();

        let index = items.indexOf(selectedItem) + (event.key === 'ArrowDown' ? 1 : -1);
        if (index < 0) index = items.length - 1;
        if (index > items.length - 1) index = 0;
        this.setSelectedItem(items[index]);
      }
    }
  }

  handleMenuMouseDown(event: MouseEvent) {
    // Keep focus on the dropdown trigger when selecting menu items
    event.preventDefault();
  }

  handleMenuMouseOver(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const dropdownItem = target.closest('s-dropdown-item');

    if (dropdownItem) {
      this.setSelectedItem(dropdownItem);
    }
  }

  handleMenuMouseOut() {
    this.setSelectedItem(null);
  }

  handleTransitionEnd() {
    this.menu.hidden = !this.isOpen;
  }

  toggleMenu() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  render() {
    return (
      <div
        id={this.id}
        class={{
          's-dropdown': true,
          's-dropdown--open': this.isOpen
        }}
        aria-expanded={this.isOpen}
        aria-haspopup="true"
      >
        <span class="s-dropdown__trigger" ref={el => (this.trigger = el)} onClick={() => this.toggleMenu()}>
          <slot name="trigger" />
        </span>

        <div
          class="s-dropdown__menu"
          ref={el => (this.menu = el)}
          role="menu"
          aria-hidden={!this.isOpen}
          aria-labeledby={this.id}
          onMouseDown={this.handleMenuMouseDown}
          onMouseOver={this.handleMenuMouseOver}
          onMouseOut={this.handleMenuMouseOut}
          onTransitionEnd={this.handleTransitionEnd}
          hidden
        >
          <slot />
        </div>
      </div>
    );
  }
}