import { AppShell } from "@/components/app-shell";
import { ScreenState } from "@/components/screen-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/lib/messages";
import { halfHours, toMinutes } from "@/lib/time";
import {
  canSeeTitle,
  currentUser,
  reservations,
  rooms,
  sampleDate,
} from "@/mock/data";

const slots = halfHours(9, 18);

export default function StatusPage() {
  const rows = reservations.filter(
    (r) => r.date === sampleDate && r.status === "RESERVED",
  );

  return (
    <AppShell title="예약 현황">
      <ScreenState emptyMessage={t("rsv.status.room.empty")}>
        <div className="mb-4 flex items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="date">날짜</Label>
            <Input id="date" type="date" defaultValue={sampleDate} />
          </div>
        </div>

        {/* 데스크톱·태블릿: 회의실 × 30분 시간표 */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr>
                <th scope="col" className="w-20 border-b p-2 text-left">
                  시간
                </th>
                {rooms.map((room) => (
                  <th key={room.meetingRoomId} scope="col" className="border-b p-2 text-left">
                    {room.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot}>
                  <th scope="row" className="border-b p-2 text-left font-normal text-muted-foreground">
                    {slot}
                  </th>
                  {rooms.map((room) => {
                    const hit = rows.find(
                      (r) =>
                        r.meetingRoomId === room.meetingRoomId &&
                        toMinutes(r.start) <= toMinutes(slot) &&
                        toMinutes(slot) < toMinutes(r.end),
                    );
                    return (
                      <td
                        key={room.meetingRoomId}
                        className={
                          hit
                            ? "border-b bg-primary/10 p-2"
                            : "border-b p-2 text-muted-foreground"
                        }
                      >
                        {hit
                          ? canSeeTitle(hit, currentUser)
                            ? `예약됨 · ${hit.title}`
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
          {rooms.map((room) => {
            const list = rows.filter((r) => r.meetingRoomId === room.meetingRoomId);
            return (
              <section key={room.meetingRoomId} className="rounded-lg border p-3">
                <h2 className="mb-2 font-bold">{room.name}</h2>
                {list.length === 0 ? (
                  <p className="text-sm text-muted-foreground">예약이 없습니다</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {list.map((r) => (
                      <li key={r.reservationId}>
                        {r.start}~{r.end}
                        {canSeeTitle(r, currentUser) ? ` · ${r.title}` : " · 예약됨"}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </ScreenState>
    </AppShell>
  );
}
