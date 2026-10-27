import { z } from "zod";

/** 런타임 검증 스키마의 자리. 실제 스키마는 API 명세서 확정(5-IM-12) 뒤 Frontend 코드 구현(5-IM-14)에서 만든다. */
export const idSchema = z.number().int().positive();
