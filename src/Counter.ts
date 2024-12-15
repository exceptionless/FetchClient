import { ObjectEvent } from "./ObjectEvent.ts";

/**
 * Represents a counter that can be incremented and decremented.
 */
export class Counter {
  #count: number = 0;
  #onChange = new ObjectEvent<{ previous: number; value: number }>();

  /**
   * Gets the current count.
   */
  public get count(): number {
    return this.#count;
  }

  /**
   * Gets an event that is triggered when the count changes.
   */
  public get changed() {
    return this.#onChange.expose();
  }

  /**
   * Increments the count by 1.
   */
  increment() {
    const previous = this.#count;
    this.#count++;
    this.#onChange.trigger({ previous, value: this.#count });
  }

  /**
   * Decrements the count by 1.
   */
  decrement() {
    const previous = this.#count;
    this.#count--;
    this.#onChange.trigger({ previous, value: this.#count });
  }
}
