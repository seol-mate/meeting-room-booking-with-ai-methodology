"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** 파괴적 동작(예약 취소) 실행 전 확인 대화상자 — C-RSV-MY-004, C-MTR-ALL-005 */
export function CancelDialog({
  open,
  message,
  pending,
  onConfirm,
  onClose,
}: {
  open: boolean;
  message: string;
  pending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>예약 취소</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            닫기
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={pending}>
            예약 취소
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
