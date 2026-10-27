import { AppShell } from "@/components/app-shell";
import { ScreenState } from "@/components/screen-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { t } from "@/lib/messages";
import { reservations, roomName, rooms, sampleDate } from "@/mock/data";

export default function AllReservationsPage() {
  return (
    <AppShell title="전체 예약">
      <ScreenState emptyMessage={t("mtr.all.list.empty")}>
        <form className="mb-4 flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="from">시작일</Label>
            <Input id="from" name="from" type="date" defaultValue={sampleDate} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="to">종료일</Label>
            <Input id="to" name="to" type="date" defaultValue={sampleDate} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="room">회의실</Label>
            <NativeSelect id="room" name="room" defaultValue="">
              <option value="">전체</option>
              {rooms.map((r) => (
                <option key={r.meetingRoomId} value={r.meetingRoomId}>
                  {r.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <Button type="submit">조회</Button>
        </form>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>회의실</TableHead>
                <TableHead>날짜</TableHead>
                <TableHead>시간</TableHead>
                <TableHead>예약자</TableHead>
                <TableHead>회의 제목</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((r) => (
                <TableRow key={r.reservationId}>
                  <TableCell>{roomName(r.meetingRoomId)}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>
                    {r.start}~{r.end}
                  </TableCell>
                  <TableCell>{r.reserverName}</TableCell>
                  <TableCell>{r.title}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status === "RESERVED" ? (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={r.started}
                      >
                        취소
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScreenState>
    </AppShell>
  );
}
