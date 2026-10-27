"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { FieldError } from "@/components/field-error";
import { StateError, StateLoading } from "@/components/screen-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateRoom, useRoom, useUpdateRoom } from "@/hooks/use-meeting-rooms";
import { isApiError } from "@/lib/api-error";
import { t } from "@/lib/messages";
import { fieldErrors, roomFormSchema } from "@/lib/schemas";
import type { MeetingRoom } from "@/types/domain";
import { useToastStore } from "@/store/toast-store";

function RoomEditForm({ room }: { room: MeetingRoom | null }) {
  const router = useRouter();
  const create = useCreateRoom();
  const update = useUpdateRoom();
  const pushToast = useToastStore((state) => state.push);
  const [values, setValues] = useState({
    name: room?.name ?? "",
    location: room?.location ?? "",
    capacity: room?.capacity ? String(room.capacity) : "",
    equipment: room?.equipment ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const pending = create.isPending || update.isPending;

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFailure(null);
    const parsed = roomFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    const form = parsed.data;
    const input = {
      name: form.name,
      location: form.location || null,
      capacity: form.capacity === "" ? null : Number(form.capacity),
      equipment: form.equipment || null,
    };
    const callbacks = {
      onSuccess: () => {
        pushToast(t("mtr.edit.save.success"));
        router.push("/admin/rooms");
      },
      onError: (error: unknown) => {
        if (isApiError(error) && error.status === 400) setErrors({ name: error.message });
        else setFailure(t("mtr.edit.save.failed"));
      },
    };
    if (room) update.mutate({ meetingRoomId: room.meetingRoomId, input }, callbacks);
    else create.mutate(input, callbacks);
  }

  return (
    <form className="max-w-lg space-y-4" onSubmit={onSubmit} noValidate>
      {failure && (
        <Alert variant="destructive" data-testid="form-error">
          <AlertDescription>{failure}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="name">회의실명</Label>
        <Input
          id="name"
          data-testid="field-name"
          name="name"
          value={values.name}
          maxLength={100}
          aria-invalid={Boolean(errors.name)}
          aria-describedby="name-error"
          onChange={(e) => setValues({ ...values, name: e.target.value })}
        />
        <FieldError id="name-error" message={errors.name} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="location">위치</Label>
        <Input
          id="location"
          data-testid="field-location"
          name="location"
          value={values.location}
          maxLength={200}
          onChange={(e) => setValues({ ...values, location: e.target.value })}
        />
        <FieldError message={errors.location} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="capacity">수용 인원</Label>
        <Input
          id="capacity"
          data-testid="field-capacity"
          name="capacity"
          type="number"
          min={1}
          step={1}
          value={values.capacity}
          onChange={(e) => setValues({ ...values, capacity: e.target.value })}
        />
        <FieldError message={errors.capacity} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="equipment">비치 장비</Label>
        <Input
          id="equipment"
          data-testid="field-equipment"
          name="equipment"
          value={values.equipment}
          maxLength={500}
          onChange={(e) => setValues({ ...values, equipment: e.target.value })}
        />
        <FieldError message={errors.equipment} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="lg" data-testid="submit-button" disabled={pending}>
          저장
        </Button>
        <Link href="/admin/rooms" className={buttonVariants({ variant: "outline", size: "lg" })}>
          취소
        </Link>
      </div>
    </form>
  );
}

function RoomEditView() {
  const params = useSearchParams();
  const idParam = params.get("id");
  const id = idParam && /^\d+$/.test(idParam) ? Number(idParam) : null;
  const room = useRoom(id);

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">{id === null ? "회의실 등록" : "회의실 변경"}</h1>
      {id === null ? (
        <RoomEditForm room={null} />
      ) : room.isPending ? (
        <StateLoading />
      ) : room.isError ? (
        <StateError onRetry={() => void room.refetch()} />
      ) : (
        <RoomEditForm key={room.data.meetingRoomId} room={room.data} />
      )}
    </>
  );
}

export default function RoomEditPage() {
  return (
    <Suspense fallback={<StateLoading />}>
      <RoomEditView />
    </Suspense>
  );
}
