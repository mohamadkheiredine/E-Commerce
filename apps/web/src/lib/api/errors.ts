import { apiErrorSchema, type ErrorCode } from '@ecom/contracts';

/**
 * The web-side counterpart of the API's `AppError`: a thrown value that carries the
 * stable `code` so callers can branch on it (`if (error.code === 'OUT_OF_STOCK')`)
 * instead of matching on message text.
 */
export class ApiClientError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: Record<string, string[]>;
  readonly requestId?: string;

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    options?: { details?: Record<string, string[]>; requestId?: string; cause?: unknown },
  ) {
    super(message, { cause: options?.cause });
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = options?.details;
    this.requestId = options?.requestId;
  }

  /** Builds from a failed response, tolerating bodies that are not our envelope. */
  static async fromResponse(response: Response): Promise<ApiClientError> {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      // Not JSON — a proxy error page, an empty body. Fall through to the generic shape.
    }

    const parsed = apiErrorSchema.safeParse(body);
    if (parsed.success) {
      const { error, requestId } = parsed.data;
      return new ApiClientError(response.status, error.code, error.message, {
        details: error.details,
        requestId,
      });
    }

    return new ApiClientError(
      response.status,
      response.status === 401 ? 'UNAUTHENTICATED' : 'INTERNAL_ERROR',
      `API responded with ${response.status}`,
    );
  }
}

export const isApiClientError = (error: unknown): error is ApiClientError =>
  error instanceof ApiClientError;
