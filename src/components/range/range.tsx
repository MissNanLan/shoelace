import { Component, Method, Prop, State, h } from '@stencil/core';

@Component({
  tag: 'sl-range',
  styleUrl: 'range.scss',
  scoped: true
})
export class Range {
  input: HTMLInputElement;
  output: HTMLElement;

  constructor() {
    this.handleInput = this.handleInput.bind(this);
  }

  @State() hasFocus = false;

  /** The input's name attribute. */
  @Prop() name = '';

  /** The input's value attribute. */
  @Prop({ mutable: true }) value: number;

  /** Set to true to disable the input. */
  @Prop() disabled = false;

  /** The input's min attribute. */
  @Prop() min = 0;

  /** The input's max attribute. */
  @Prop() max = 100;

  /** The input's step attribute. */
  @Prop() step = 1;

  /**
   * By default, a tooltip showing the current value will appear when the range has focus. Set this to `off` to prevent
   * the tooltip from showing.
   */
  @Prop() tooltip: 'auto' | 'off' = 'auto';

  componentWillLoad() {
    if (this.value === undefined || this.value === null) this.value = this.min;
    if (this.value < this.min) this.value = this.min;
    if (this.value > this.max) this.value = this.max;
  }

  componentDidLoad() {
    this.syncTooltip();
  }

  /** Sets focus on the input. */
  @Method()
  async setFocus() {
    this.input.focus();
  }

  /** Removes focus from the input. */
  @Method()
  async removeFocus() {
    this.input.blur();
  }

  handleInput() {
    this.value = Number(this.input.value);
    requestAnimationFrame(() => this.syncTooltip());
  }

  syncTooltip() {
    if (this.tooltip === 'auto') {
      const percent = Math.max(0, (this.value - this.min) / (this.max - this.min));
      const inputWidth = this.input.offsetWidth;
      const tooltipWidth = this.output.offsetWidth;
      const thumbSize = getComputedStyle(this.input).getPropertyValue('--range-thumb-size');
      const x = `calc(${inputWidth * percent}px - calc(calc(${percent} * ${thumbSize}) - calc(${thumbSize} / 2)))`;

      this.output.style.transform = `translateX(${x})`;
      this.output.style.marginLeft = `-${tooltipWidth / 2}px`;
    }
  }

  render() {
    return (
      <div
        class={{
          'sl-range': true,

          // States
          'sl-range--disabled': this.disabled,
          'sl-range--focused': this.hasFocus
        }}
        onClick={() => this.input.focus()}
      >
        <input
          ref={el => (this.input = el)}
          type="range"
          class="sl-range__control"
          name={this.name}
          disabled={this.disabled}
          min={this.min}
          max={this.max}
          step={this.step}
          value={this.value}
          onFocus={() => (this.hasFocus = true)}
          onBlur={() => (this.hasFocus = false)}
          onInput={this.handleInput}
        />
        {this.tooltip === 'auto' && (
          <output ref={el => (this.output = el)} class="sl-range__tooltip">
            {this.value}
          </output>
        )}
      </div>
    );
  }
}