"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { CancelDialog } from "@/components/cancel-dialog";
import { FieldError } from "@/components/field-error";
import { StateEmpty, StateError, StateLoading } from "@/components/screen-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRooms } from "@/hooks/use-meeting-rooms";
import { useNow } from "@/hooks/use-now";
import { useAdminReservations, useCancelReservation } from "@/hooks/use-reservations";
import { isApiError } from "@/lib/api-error";
import { t } from "@/lib/messages";
import { periodSchema } from "@/lib/schemas";
import { addDays, formatRange, todayString } from "@/lib/time";
import { useToastStore } from "@/store/toast-store";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** 조회 조건 폼 — 조회 버튼을 눌러야 주소(조건)가 바뀌고 목록이 갱신된다 */
function FilterForm({
  from,
  to,
  roomId,
  onApply,
}: {
  from: string;
  to: string;
  roomId: string;
  onApply: (next: { from: string; to: string; roomId: string }) => void;
}) {
  const rooms = useRooms();
  const [draft, setDraft] = useState({ from, to, roomId });
  const [error, setError] = useState<string | undefined>();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = periodSchema.safeParse({ from: draft.from, to: draft.to });
    if (!parsed.success) {
      setError(t("mtr.all.period.invalid"));
      return;
    }
    setError(undefined);
    onApply(draft);
  }

  return (
    <form className="mb-4 space-y-2" onSubmit={onSubmit} noValidate>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="from">시작일</Label>
          <Input
            id="from"
            data-testid="field-from"
            name="from"
            type="date"
            value={draft.from}
            onChange={(e) => setDraft({ ...draft, from: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="to">종료일</Label>
          <Input
            id="to"
            data-testid="field-to"
            name="to"
            type="date"
            value={draft.to}
            aria-invalid={Boolean(error)}
            aria-describedby="period-error"
            onChange={(e) => setDraft({ ...draft, to: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="room">회의실</Label>
          <NativeSelect
            id="room"
            data-testid="field-room"
            name="room"
            value={draft.roomId}
            onChange={(e) => setDraft({ ...draft, roomId: e.target.value })}
          >
            <option value="">전체</option>
            {rooms.data?.map((room) => (
              <option key={room.meetingRoomId} value={room.meetingRoomId}>
                {room.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <Button type="submit" data-testid="submit-button">
          조회
        </Button>
      </div>
      <FieldError id="period-error" message={error} />
    </form>
  );
}

function AdminReservationsView() {
  const router = useRouter();
  const params = useSearchParams();
  const [defaults] = useState(() => ({ from: todayString(), to: addDays(todayString(), 6) }));
  const fromParam = params.get("from");
  const toParam = params.get("to");
  const roomParam = params.get("room") ?? "";
  const from = fromParam && DATE_PATTERN.test(fromParam) ? fromParam : defaults.from;
  const to = toParam && DATE_PATTERN.test(toParam) ? toParam : defaults.to;
  const meetingRoomId = /^\d+$/.test(roomParam) ? Number(roomParam) : undefined;

  const list = useAdminReservations({ from, to, meetingRoomId }, from <= to);
  const cancel = useCancelReservation();
  const now = useNow();
  const pushToast = useToastStore((state) => state.push);
  const [target, setTarget] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function confirmCancel() {
    if (target === null) return;
    setNotice(null);
    cancel.mutate(target, {
      onSuccess: () => pushToast(t("mtr.all.cancel.success")),
      onError: (error) =>
        setNotice(isApiError(error) && error.status === 422 ? t("mtr.all.cancel.started") : t("common.state.error")),
      onSettled: () => setTarget(null),
    });
  }

  return (
    <>
      <FilterForm
        key={`${from}|${to}|${roomParam}`}
        from={from}
        to={to}
        roomId={roomParam}
        onApply={(next) =>
          router.replace(`/admin/reservations?from=${next.from}&to=${next.to}${next.roomId ? `&room=${next.roomId}` : ""}`)
        }
      />
      {notice && (
        <Alert variant="destructive" className="mb-4" data-testid="form-error">
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}
      {list.isPending ? (
        <StateLoading />
      ) : list.isError ? (
        <StateError message={t("mtr.all.list.failed")} onRetry={() => void list.refetch()} />
      ) : list.data.length === 0 ? (
        <StateEmpty message={t("mtr.all.list.empty")} />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>회의실</TableHead>
                <TableHead>시간</TableHead>
                <TableHead>예약자</TableHead>
                <TableHead>회의 제목</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.data.map((item) => (
                <TableRow key={item.reservationId} data-testid={`row-${item.reservationId}`}>
                  <TableCell>{item.meetingRoomName}</TableCell>
                  <TableCell>{formatRange(item.startAt, item.endAt)}</TableCell>
                  <TableCell>{item.reserverName}</TableCell>
                  <TableCell>{item.title ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      data-testid={`cancel-${item.reservationId}`}
                      disabled={item.startAt <= now}
                      onClick={() => setTarget(item.reservationId)}
                    >
                      취소
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <CancelDialog
        open={target !== null}
        message={t("mtr.all.cancel.confirm")}
        pending={cancel.isPending}
        onConfirm={confirmCancel}
        onClose={() => setTarget(null)}
      />
    </>
  );
}

export default function AllReservationsPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">전체 예약</h1>
      <Suspense fallback={<StateLoading />}>
        <AdminReservationsView />
      </Suspense>
    </>
  );
}
