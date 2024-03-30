export class Counter {
  private _count: number = 0;
  private _onChange: ((count: number) => void) | undefined;

  constructor(onChange?: (count: number) => void) {
    this._onChange = onChange;
  }

  public get count(): number {
    return this._count;
  }

  increment() {
    this._count++;
    if (this._onChange) {
      this._onChange(this._count);
    }
  }

  decrement() {
    this._count--;
    if (this._onChange) {
      this._onChange(this._count);
    }
  }
}
