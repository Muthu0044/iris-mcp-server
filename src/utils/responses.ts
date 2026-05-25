export type ToolSuccess<T> = {
  success: true;
  data: T;
};

export type ToolFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ToolResponse<T> = ToolSuccess<T> | ToolFailure;

export function ok<T>(data: T): ToolSuccess<T> {
  return { success: true, data };
}

export function fail(code: string, message: string, details?: unknown): ToolFailure {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details })
    }
  };
}

export function asMcpText<T>(response: ToolResponse<T>) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(response, null, 2)
      }
    ]
  };
}
