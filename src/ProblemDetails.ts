/**
 * Represents a problem details object.
 */
export class ProblemDetails implements Record<string, unknown> {
  [key: string]: unknown;
  /**
   * The type of the problem details.
   */
  type?: string;
  /**
   * The title of the problem details.
   */
  title?: string;
  /**
   * The HTTP status code of the problem details.
   */
  status?: number;
  /**
   * Additional details about the problem.
   */
  detail?: string;
  /**
   * The URI of the specific occurrence of the problem.
   */
  instance?: string;
  /**
   * Represents the errors associated with a problem details response.
   */
  errors: Record<string, string[] | undefined> = {};

  /**
   * Clears the error with the specified name.
   * @param name - The name of the error to clear.
   * @returns The updated ProblemDetails instance.
   */
  clear(name: string): ProblemDetails {
    delete this.errors[name];
    return this;
  }

  /**
   * Sets the error message for the general error.
   * @param message - The error message to set.
   * @returns The updated ProblemDetails instance.
   */
  setErrorMessage(message: string): ProblemDetails {
    this.errors.general = [message];
    return this;
  }
}
