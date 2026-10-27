"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FieldError } from "@/components/field-error";
import { StateEmpty, StateError, StateLoading } from "@/components/screen-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useRooms } from "@/hooks/use-meeting-rooms";
import { useCreateReservation } from "@/hooks/use-reservations";
import { isApiError } from "@/lib/api-error";
import { t } from "@/lib/messages";
import { fieldErrors, reservationFormSchema } from "@/lib/schemas";
import { allHalfHours, toLocalDateTime, todayString } from "@/lib/time";
import type { MeetingRoom } from "@/types/domain";
import { useToastStore } from "@/store/toast-store";

const roomLabel = (room: MeetingRoom) => {
  const detail = [room.location, room.capacity ? `${room.capacity}명` : null].filter(Boolean).join(", ");
  return detail ? `${room.name} (${detail})` : room.name;
};

function ReservationForm({ rooms }: { rooms: MeetingRoom[] }) {
  const router = useRouter();
  const create = useCreateReservation();
  const pushToast = useToastStore((state) => state.push);
  const [values, setValues] = useState(() => ({
    meetingRoomId: "",
    date: todayString(),
    start: "09:00",
    end: "10:00",
    title: "",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFailure(null);
    const parsed = reservationFormSchema.safeParse({ ...values, meetingRoomId: Number(values.meetingRoomId) });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    const form = parsed.data;
    create.mutate(
      {
        meetingRoomId: form.meetingRoomId,
        startAt: toLocalDateTime(form.date, form.start),
        endAt: toLocalDateTime(form.date, form.end),
        title: form.title || null,
      },
      {
        onSuccess: () => {
          pushToast(t("rsv.new.submit.success"));
          router.push("/my-reservations");
        },
        onError: (error) => {
          if (isApiError(error) && error.status === 409) setErrors({ end: t("rsv.new.time.overlap") });
          else if (isApiError(error) && error.status === 422) setErrors({ end: t("rsv.new.time.invalid") });
          else setFailure(t("rsv.new.submit.failed"));
        },
      },
    );
  }

  return (
    <form className="max-w-lg space-y-4" onSubmit={onSubmit} noValidate>
      {failure && (
        <Alert variant="destructive" data-testid="form-error">
          <AlertDescription>{failure}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="room">회의실</Label>
        <NativeSelect
          id="room"
          data-testid="field-room"
          name="room"
          value={values.meetingRoomId}
          onChange={(e) => setValues({ ...values, meetingRoomId: e.target.value })}
        >
          <option value="" disabled>
            선택해 주세요
          </option>
          {rooms.map((room) => (
            <option key={room.meetingRoomId} value={room.meetingRoomId}>
              {roomLabel(room)}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="date">날짜</Label>
        <Input
          id="date"
          data-testid="field-date"
          name="date"
          type="date"
          value={values.date}
          onChange={(e) => setValues({ ...values, date: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="start">시작</Label>
          <NativeSelect
            id="start"
            data-testid="field-start"
            name="start"
            value={values.start}
            onChange={(e) => setValues({ ...values, start: e.target.value })}
          >
            {allHalfHours.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end">종료</Label>
          <NativeSelect
            id="end"
            data-testid="field-end"
            name="end"
            value={values.end}
            aria-invalid={Boolean(errors.end)}
            aria-describedby="end-error"
            onChange={(e) => setValues({ ...values, end: e.target.value })}
          >
            {allHalfHours.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <FieldError id="end-error" message={errors.end} />
      <p className="text-sm text-muted-foreground">30분 단위로 최소 30분, 최대 4시간까지 예약할 수 있습니다.</p>
      <div className="space-y-1.5">
        <Label htmlFor="title">회의 제목</Label>
        <Input
          id="title"
          data-testid="field-title"
          name="title"
          value={values.title}
          maxLength={200}
          onChange={(e) => setValues({ ...values, title: e.target.value })}
        />
      </div>
      {/* 모바일에서는 [예약]을 하단에 고정한다 */}
      <div className="sticky bottom-0 -mx-4 flex gap-2 border-t bg-background px-4 py-3 md:static md:mx-0 md:border-0 md:px-0">
        <Button type="submit" size="lg" data-testid="submit-button" disabled={create.isPending || values.meetingRoomId === ""}>
          예약
        </Button>
        <Link href="/status" className={buttonVariants({ variant: "outline", size: "lg" })}>
          취소
        </Link>
      </div>
    </form>
  );
}

export default function NewReservationPage() {
  const rooms = useRooms();
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">회의실 예약</h1>
      {rooms.isPending ? (
        <StateLoading />
      ) : rooms.isError ? (
        <StateError onRetry={() => void rooms.refetch()} />
      ) : rooms.data.length === 0 ? (
        <StateEmpty message={t("rsv.status.room.empty")} />
      ) : (
        <ReservationForm rooms={rooms.data} />
      )}
    </>
  );
}
