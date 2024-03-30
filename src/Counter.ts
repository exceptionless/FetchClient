/**
 * Represents a counter that can be incremented and decremented.
 */
export class Counter {
  private _count: number = 0;
  private _onChange: ((count: number) => void) | undefined;

  /**
   * Creates a new instance of the Counter class.
   * @param onChange - Optional callback function that will be called whenever the count changes.
   */
  constructor(onChange?: (count: number) => void) {
    this._onChange = onChange;
  }

  /**
   * Gets the current count.
   */
  public get count(): number {
    return this._count;
  }

  /**
   * Increments the count by 1.
   */
  increment() {
    this._count++;
    if (this._onChange) {
      this._onChange(this._count);
    }
  }

  /**
   * Decrements the count by 1.
   */
  decrement() {
    this._count--;
    if (this._onChange) {
      this._onChange(this._count);
    }
  }
}
