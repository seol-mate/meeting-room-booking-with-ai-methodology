import { AppShell } from "@/components/app-shell";
import { ScreenState } from "@/components/screen-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { t } from "@/lib/messages";
import { currentUser, reservations, roomName } from "@/mock/data";

export default function MyReservationsPage() {
  const mine = reservations.filter((r) => r.reserverName === currentUser.name);

  return (
    <AppShell title="내 예약">
      <ScreenState emptyMessage={t("rsv.my.list.empty")}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>회의실</TableHead>
                <TableHead>날짜</TableHead>
                <TableHead>시간</TableHead>
                <TableHead>회의 제목</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mine.map((r) => (
                <TableRow key={r.reservationId}>
                  <TableCell>{roomName(r.meetingRoomId)}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>
                    {r.start}~{r.end}
                  </TableCell>
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
