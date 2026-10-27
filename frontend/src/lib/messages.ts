/** 사용자 메시지 — 키와 문구는 4-DN-36-O1(UI&UX 제약사항)을 따른다. 다국어 요구가 없어 ko만 둔다. */
export const messages = {
  "common.state.loading": "불러오는 중입니다",
  "common.state.empty": "등록된 항목이 없습니다",
  "common.state.error": "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요",
  "common.state.forbidden": "이 화면에 접근할 권한이 없습니다",
  "common.state.saved": "저장되었습니다",
  "common.state.saveFailed": "저장하지 못했습니다",

  "rsv.login.submit.failed": "로그인 정보가 올바르지 않습니다.",
  "rsv.login.access.required": "로그인이 필요합니다.",
  "rsv.login.id.required": "로그인 ID를 입력해 주세요.",
  "rsv.login.password.required": "비밀번호를 입력해 주세요.",

  "rsv.join.submit.success": "계정이 만들어졌습니다. 로그인해 주세요.",
  "rsv.join.submit.failed": "계정을 만들지 못했습니다.",
  "rsv.join.id.duplicate": "이미 사용 중인 로그인 ID입니다.",
  "rsv.join.field.required": "필수 항목을 입력해 주세요.",

  "rsv.status.room.empty": "등록된 회의실이 없습니다.",
  "rsv.status.list.failed": "예약 현황을 불러오지 못했습니다.",

  "rsv.new.submit.success": "예약이 등록되었습니다.",
  "rsv.new.time.invalid":
    "예약은 30분 단위로 최소 30분, 최대 4시간까지 가능합니다.",
  "rsv.new.time.overlap": "이미 예약된 시간입니다.",
  "rsv.new.submit.failed": "예약을 등록하지 못했습니다.",

  "rsv.my.cancel.confirm": "이 예약을 취소하시겠습니까?",
  "rsv.my.cancel.success": "예약이 취소되었습니다.",
  "rsv.my.cancel.started": "시작된 예약은 취소할 수 없습니다.",
  "rsv.my.cancel.failed": "예약을 취소하지 못했습니다.",
  "rsv.my.list.empty": "예약 내역이 없습니다.",

  "mtr.list.room.empty": "등록된 회의실이 없습니다. 신규 등록해 주세요.",

  "mtr.edit.name.required": "회의실명을 입력해 주세요.",
  "mtr.edit.save.success": "회의실 정보가 저장되었습니다.",
  "mtr.edit.save.failed": "회의실 정보를 저장하지 못했습니다.",

  "mtr.all.period.invalid": "조회 기간의 시작일이 종료일보다 늦을 수 없습니다.",
  "mtr.all.list.empty": "조회 기간에 예약이 없습니다.",
  "mtr.all.cancel.confirm": "이 예약을 취소하시겠습니까?",
  "mtr.all.cancel.success": "예약이 취소되었습니다.",
  "mtr.all.cancel.started": "시작된 예약은 취소할 수 없습니다.",
  "mtr.all.list.failed": "예약 목록을 불러오지 못했습니다.",
} as const;

export type MessageKey = keyof typeof messages;

export function t(key: MessageKey): string {
  return messages[key];
}
