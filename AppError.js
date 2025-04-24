export class AppError extends Error {
  constructor(message, status = "error") {
    super(message);
    this.status = status;
  }
}
