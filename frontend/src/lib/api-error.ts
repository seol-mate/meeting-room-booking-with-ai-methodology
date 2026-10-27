/** API 오류 — 응답 봉투의 error(code·message·errors)를 화면이 다루기 쉬운 형태로 옮긴 것 */
export type FieldError = { field: string; reason: string };

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly errors: FieldError[];

  constructor(status: number, code: string, message: string, errors: FieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
