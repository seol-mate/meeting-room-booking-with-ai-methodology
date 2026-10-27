import { AxiosError } from "axios";
import { z } from "zod";
import { ApiError, type FieldError } from "@/lib/api-error";
import { http } from "@/lib/axios";

const envelope = z.object({
  success: z.boolean(),
  data: z.unknown().nullish(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      errors: z.array(z.object({ field: z.string(), reason: z.string().optional() })).nullish(),
    })
    .nullish(),
});

/** 응답 시각("YYYY-MM-DDTHH:mm:ss…")을 화면이 쓰는 "YYYY-MM-DDTHH:mm"으로 줄인다 */
export const localDateTime = z.string().transform((v) => v.slice(0, 16));

const INVALID = "서버 응답 형식이 올바르지 않습니다.";

function toApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    if (!error.response) return new ApiError(0, "ERR-NETWORK", "서버에 연결하지 못했습니다.");
    const parsed = envelope.safeParse(error.response.data);
    if (parsed.success && parsed.data.error) {
      const { code, message, errors } = parsed.data.error;
      const fields: FieldError[] = (errors ?? []).map((e) => ({ field: e.field, reason: e.reason ?? "" }));
      return new ApiError(error.response.status, code, message, fields);
    }
    return new ApiError(error.response.status, "ERR-UNKNOWN", "요청을 처리하지 못했습니다.");
  }
  return new ApiError(0, "ERR-UNKNOWN", error instanceof Error ? error.message : "요청을 처리하지 못했습니다.");
}

/** 요청을 보내고 봉투의 data를 스키마로 검증해 돌려준다. 오류는 모두 ApiError로 바꾼다 */
export async function request<T>(
  config: { method: "get" | "post" | "put" | "patch"; url: string; params?: unknown; data?: unknown },
  schema: z.ZodType<T>,
): Promise<T> {
  let body: unknown;
  try {
    body = (await http.request({ ...config })).data;
  } catch (error) {
    throw toApiError(error);
  }
  const envelopeResult = envelope.safeParse(body);
  if (!envelopeResult.success || !envelopeResult.data.success) throw new ApiError(0, "ERR-INVALID-RESPONSE", INVALID);
  const data = schema.safeParse(envelopeResult.data.data);
  if (!data.success) throw new ApiError(0, "ERR-INVALID-RESPONSE", INVALID);
  return data.data;
}
