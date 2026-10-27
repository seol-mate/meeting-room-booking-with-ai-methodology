import { Badge } from "@/components/ui/badge";
import type { ReservationStatus } from "@/types/domain";

/** 예약 상태 배지 — 색과 라벨을 함께 쓴다 (4-DN-33-O1 §8.1) */
export function StatusBadge({ status }: { status: ReservationStatus }) {
  if (status === "CANCELLED") {
    return <Badge variant="secondary">취소됨</Badge>;
  }
  return <Badge className="bg-success text-success-foreground">예약됨</Badge>;
}
