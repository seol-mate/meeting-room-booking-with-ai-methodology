"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  StateEmpty,
  StateError,
  StateLoading,
} from "@/components/screen-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRooms } from "@/hooks/use-meeting-rooms";
import { useReservationStatus } from "@/hooks/use-reservations";
import { t } from "@/lib/messages";
import { halfHours, splitLocalDateTime, todayString } from "@/lib/time";
import type { ReservationStatusItem } from "@/types/domain";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** 표에 보일 시간 범위 — 기본 09:00~18:00이고, 그 밖의 예약이 있으면 넓힌다 */
function hourRange(
  items: ReservationStatusItem[],
  date: string,
): [number, number] {
  let from = 9;
  let to = 18;
  for (const item of items) {
    const start = splitLocalDateTime(item.startAt);
    const end = splitLocalDateTime(item.endAt);
    from = Math.min(from, Number(start.time.slice(0, 2)));
    const endHour =
      end.date === date
        ? Math.ceil(
            Number(end.time.slice(0, 2)) + Number(end.time.slice(3)) / 60,
          )
        : 24;
    to = Math.max(to, endHour);
  }
  return [from, to];
}

function StatusView() {
  const router = useRouter();
  const params = useSearchParams();
  const [today] = useState(() => todayString());
  const requested = params.get("date");
  const date = requested && DATE_PATTERN.test(requested) ? requested : today;

  const rooms = useRooms();
  const status = useReservationStatus(date);

  if (rooms.isPending || status.isPending) return <StateLoading />;
  if (rooms.isError || status.isError) {
    return (
      <StateError
        message={t("rsv.status.list.failed")}
        onRetry={() => {
          void rooms.refetch();
          void status.refetch();
        }}
      />
    );
  }

  const items = status.data;
  const [fromHour, toHour] = hourRange(items, date);
  const slots = halfHours(fromHour, toHour);

  const itemAt = (meetingRoomId: number, slot: string) =>
    items.find(
      (i) =>
        i.meetingRoomId === meetingRoomId &&
        i.startAt <= `${date}T${slot}` &&
        `${date}T${slot}` < i.endAt,
    );
  const label = (item: ReservationStatusItem) =>
    `${item.reserverName}${item.title ? ` · ${item.title}` : ""}`;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="date">날짜</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) =>
                e.target.value &&
                router.replace(`/status?date=${e.target.value}`)
              }
            />
          </div>
          <Button type="submit" variant="outline">
            조회
          </Button>
        </form>
        <Link href="/reservations/new" className={buttonVariants()}>
          예약하기
        </Link>
      </div>

      {rooms.data.length === 0 ? (
        <StateEmpty message={t("rsv.status.room.empty")} />
      ) : (
        <>
          {/* 데스크톱·태블릿: 회의실 × 30분 시간표 */}
          <div className="hidden overflow-x-auto md:block">
            <table data-testid="status-table" className="w-full min-w-[40rem] table-fixed border-collapse text-sm">
              <caption className="sr-only">{date} 예약 현황</caption>
              <thead>
                <tr>
                  <th scope="col" className="w-20 border-b p-2 text-left">
                    시간
                  </th>
                  {rooms.data.map((room) => (
                    <th
                      key={room.meetingRoomId}
                      scope="col"
                      className="border-b p-2 text-left"
                    >
                      {room.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot}>
                    <th
                      scope="row"
                      className="border-b p-2 text-left font-normal text-muted-foreground"
                    >
                      {slot}
                    </th>
                    {rooms.data.map((room) => {
                      const hit = itemAt(room.meetingRoomId, slot);
                      return (
                        <td
                          key={room.meetingRoomId}
                          data-testid={`cell-${room.meetingRoomId}-${slot}`}
                          className={
                            hit
                              ? "border-b bg-primary/10 p-2"
                              : "border-b p-2 text-muted-foreground"
                          }
                        >
                          {hit
                            ? hit.startAt === `${date}T${slot}`
                              ? `예약됨 · ${label(hit)}`
                              : "예약됨"
                            : "비어 있음"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일: 회의실별 예약 목록 */}
          <div className="space-y-4 md:hidden">
            {rooms.data.map((room) => {
              const list = items.filter(
                (i) => i.meetingRoomId === room.meetingRoomId,
              );
              return (
                <section
                  key={room.meetingRoomId}
                  className="rounded-lg border p-3"
                >
                  <h2 className="mb-2 font-bold">{room.name}</h2>
                  {list.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      예약이 없습니다
                    </p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {list.map((i) => (
                        <li key={i.reservationId}>
                          {splitLocalDateTime(i.startAt).time}~
                          {splitLocalDateTime(i.endAt).time} · {label(i)}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

export default function StatusPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">예약 현황</h1>
      <Suspense fallback={<StateLoading />}>
        <StatusView />
      </Suspense>
    </>
  );
}
