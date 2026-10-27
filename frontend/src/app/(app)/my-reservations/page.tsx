"use client";

import { useState } from "react";
import { CancelDialog } from "@/components/cancel-dialog";
import { StateEmpty, StateError, StateLoading } from "@/components/screen-state";
import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNow } from "@/hooks/use-now";
import { useCancelReservation, useMyReservations } from "@/hooks/use-reservations";
import { isApiError } from "@/lib/api-error";
import { t } from "@/lib/messages";
import { formatDateTime, formatRange } from "@/lib/time";
import type { MyReservationItem } from "@/mock/api";
import { useToastStore } from "@/store/toast-store";

export default function MyReservationsPage() {
  const reservations = useMyReservations();
  const cancel = useCancelReservation();
  const now = useNow();
  const pushToast = useToastStore((state) => state.push);
  const [target, setTarget] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function confirmCancel() {
    if (target === null) return;
    setNotice(null);
    cancel.mutate(target, {
      onSuccess: () => pushToast(t("rsv.my.cancel.success")),
      onError: (error) => setNotice(isApiError(error) ? error.message : t("rsv.my.cancel.failed")),
      onSettled: () => setTarget(null),
    });
  }

  /** 시작 이후 예약과 이미 취소한 예약은 [취소]를 보이지 않거나 비활성으로 둔다 (C-RSV-MY-002) */
  const cancelButton = (item: MyReservationItem) =>
    item.status === "RESERVED" ? (
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={item.startAt <= now}
        onClick={() => setTarget(item.reservationId)}
      >
        취소
      </Button>
    ) : null;

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">내 예약</h1>
      {notice && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}
      {reservations.isPending ? (
        <StateLoading />
      ) : reservations.isError ? (
        <StateError onRetry={() => void reservations.refetch()} />
      ) : reservations.data.length === 0 ? (
        <StateEmpty message={t("rsv.my.list.empty")} />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>회의실</TableHead>
                  <TableHead>일시</TableHead>
                  <TableHead>회의 제목</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.data.map((item) => (
                  <TableRow key={item.reservationId}>
                    <TableCell>{item.meetingRoomName}</TableCell>
                    <TableCell>{formatRange(item.startAt, item.endAt)}</TableCell>
                    <TableCell>{item.title ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge status={item.status} />
                        {item.cancelledAt && (
                          <span className="text-xs text-muted-foreground">{formatDateTime(item.cancelledAt)} 취소</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{cancelButton(item)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 모바일: 카드 목록, [취소]는 카드 하단 */}
          <ul className="space-y-3 md:hidden">
            {reservations.data.map((item) => (
              <li key={item.reservationId} className="space-y-2 rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold">{item.meetingRoomName}</span>
                  <StatusBadge status={item.status} />
                </div>
                <p>{formatRange(item.startAt, item.endAt)}</p>
                {item.title && <p className="text-muted-foreground">{item.title}</p>}
                {item.cancelledAt && (
                  <p className="text-xs text-muted-foreground">{formatDateTime(item.cancelledAt)} 취소</p>
                )}
                {cancelButton(item) && <div className="flex justify-end">{cancelButton(item)}</div>}
              </li>
            ))}
          </ul>
        </>
      )}
      <CancelDialog
        open={target !== null}
        message={t("rsv.my.cancel.confirm")}
        pending={cancel.isPending}
        onConfirm={confirmCancel}
        onClose={() => setTarget(null)}
      />
    </>
  );
}
