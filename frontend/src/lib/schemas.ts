import { z } from "zod";
import { t } from "@/lib/messages";
import { isValidReservationPeriod, toLocalDateTime } from "@/lib/time";

/** 화면 입력 검증 스키마 — 메시지는 UI&UX 제약사항(4-DN-36-O1)의 message_key 문구를 쓴다. 서버 검증이 최종이다. */
export const idSchema = z.number().int().positive();

export const loginSchema = z.object({
  loginId: z.string().trim().min(1, t("rsv.login.id.required")).max(50),
  password: z.string().min(1, t("rsv.login.password.required")),
});
export type LoginForm = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  loginId: z.string().trim().min(1, t("rsv.join.field.required")).max(50),
  name: z.string().trim().min(1, t("rsv.join.field.required")).max(100),
  password: z.string().min(1, t("rsv.join.field.required")),
});
export type SignupForm = z.infer<typeof signupSchema>;

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const reservationFormSchema = z
  .object({
    meetingRoomId: idSchema,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    start: z.string().regex(timePattern),
    end: z.string().regex(timePattern),
    title: z.string().trim().max(200),
  })
  .refine((v) => isValidReservationPeriod(toLocalDateTime(v.date, v.start), toLocalDateTime(v.date, v.end)), {
    message: t("rsv.new.time.invalid"),
    path: ["end"],
  });
export type ReservationForm = z.infer<typeof reservationFormSchema>;

export const roomFormSchema = z.object({
  name: z.string().trim().min(1, t("mtr.edit.name.required")).max(100, t("mtr.edit.name.required")),
  location: z.string().trim().max(200, t("mtr.edit.save.failed")),
  capacity: z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) > 0), { message: t("mtr.edit.save.failed") }),
  equipment: z.string().trim().max(500, t("mtr.edit.save.failed")),
});
export type RoomForm = z.infer<typeof roomFormSchema>;

export const periodSchema = z
  .object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine((v) => v.from <= v.to, { message: t("mtr.all.period.invalid"), path: ["to"] });

/** zod 검증 결과에서 필드별 첫 오류 문구를 꺼낸다 */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in result)) result[key] = issue.message;
  }
  return result;
}
