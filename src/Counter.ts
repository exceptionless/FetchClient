/**
 * Represents a counter that can be incremented and decremented.
 */
export class Counter {
  #count: number = 0;
  #onChange: ((count: number) => void) | undefined;

  /**
   * Creates a new instance of the Counter class.
   * @param onChange - Optional callback function that will be called whenever the count changes.
   */
  constructor(onChange?: (count: number) => void) {
    this.#onChange = onChange;
  }

  /**
   * Gets the current count.
   */
  public get count(): number {
    return this.#count;
  }

  /**
   * Increments the count by 1.
   */
  increment() {
    this.#count++;
    if (this.#onChange) {
      this.#onChange(this.#count);
    }
  }

  /**
   * Decrements the count by 1.
   */
  decrement() {
    this.#count--;
    if (this.#onChange) {
      this.#onChange(this.#count);
    }
  }
}
