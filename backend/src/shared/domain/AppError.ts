export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string | undefined;

  constructor(message: string, statusCode = 400, code?: string | undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(message: string, code?: string): AppError {
    return new AppError(message, 400, code);
  }

  static unauthorized(message = 'No autenticado', code?: string): AppError {
    return new AppError(message, 401, code);
  }

  static forbidden(message = 'Acceso denegado', code?: string): AppError {
    return new AppError(message, 403, code);
  }

  static notFound(message = 'Recurso no encontrado', code?: string): AppError {
    return new AppError(message, 404, code);
  }

  static conflict(message: string, code?: string): AppError {
    return new AppError(message, 409, code);
  }

  static unprocessable(message: string, code?: string): AppError {
    return new AppError(message, 422, code);
  }
}
