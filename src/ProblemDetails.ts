export class ProblemDetails implements Record<string, unknown> {
  [key: string]: unknown;
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors: Record<string, string[] | undefined> = {};

  clear(name: string): ProblemDetails {
    delete this.errors[name];
    return this;
  }

  setErrorMessage(message: string): ProblemDetails {
    this.errors.general = [message];
    return this;
  }
}
