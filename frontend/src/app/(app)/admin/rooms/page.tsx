import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ScreenState } from "@/components/screen-state";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { t } from "@/lib/messages";
import { rooms } from "@/mock/data";

export default function RoomsPage() {
  return (
    <AppShell title="회의실 관리">
      <ScreenState emptyMessage={t("mtr.list.room.empty")}>
        <div className="mb-4 flex justify-end">
          <Link href="/admin/rooms/edit" className={buttonVariants()}>
            회의실 등록
          </Link>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>회의실명</TableHead>
                <TableHead>위치</TableHead>
                <TableHead>수용 인원</TableHead>
                <TableHead>비품</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.meetingRoomId}>
                  <TableCell>{room.name}</TableCell>
                  <TableCell>{room.location}</TableCell>
                  <TableCell>{room.capacity}명</TableCell>
                  <TableCell>{room.equipment}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      href="/admin/rooms/edit"
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      변경
                    </Link>
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
