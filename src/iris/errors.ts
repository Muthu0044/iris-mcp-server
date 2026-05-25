import axios from "axios";

export class IrisError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly details?: unknown;

  constructor(code: string, message: string, options: { statusCode?: number; details?: unknown } = {}) {
    super(message);
    this.name = "IrisError";
    this.code = code;
    this.statusCode = options.statusCode;
    this.details = options.details;
  }
}

export function mapUnknownError(error: unknown): IrisError {
  if (error instanceof IrisError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const details = error.response?.data;

    if (status === 401 || status === 403) {
      return new IrisError("IRIS_AUTH_FAILED", "IRIS authentication failed", { statusCode: status, details });
    }

    if (status === 404) {
      return new IrisError("IRIS_NOT_FOUND", "Requested IRIS resource was not found", { statusCode: status, details });
    }

    if (status === 409) {
      return new IrisError("IRIS_CONFLICT", "IRIS reported a source conflict", { statusCode: status, details });
    }

    if (status === 423 || status === 425) {
      return new IrisError("IRIS_LOCKED", "IRIS document is locked", { statusCode: status, details });
    }

    if (error.code === "ECONNABORTED") {
      return new IrisError("IRIS_TIMEOUT", "IRIS request timed out", { details: error.message });
    }

    return new IrisError("IRIS_HTTP_ERROR", error.message, { statusCode: status, details });
  }

  if (error instanceof Error) {
    return new IrisError("IRIS_ERROR", error.message);
  }

  return new IrisError("IRIS_UNKNOWN_ERROR", "Unknown IRIS error", { details: error });
}
