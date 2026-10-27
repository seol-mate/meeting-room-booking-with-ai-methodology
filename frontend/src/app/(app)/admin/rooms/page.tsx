"use client";

import Link from "next/link";
import { StateEmpty, StateError, StateLoading } from "@/components/screen-state";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRooms } from "@/hooks/use-meeting-rooms";
import { t } from "@/lib/messages";

export default function RoomsPage() {
  const rooms = useRooms();
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">회의실 관리</h1>
      <div className="mb-4 flex justify-end">
        <Link href="/admin/rooms/edit" className={buttonVariants()}>
          신규 등록
        </Link>
      </div>
      {rooms.isPending ? (
        <StateLoading />
      ) : rooms.isError ? (
        <StateError onRetry={() => void rooms.refetch()} />
      ) : rooms.data.length === 0 ? (
        <StateEmpty message={t("mtr.list.room.empty")}>
          <Link href="/admin/rooms/edit" className={buttonVariants({ variant: "outline" })}>
            신규 등록
          </Link>
        </StateEmpty>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>회의실명</TableHead>
                <TableHead>위치</TableHead>
                <TableHead>수용 인원</TableHead>
                <TableHead>비치 장비</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.data.map((room) => (
                <TableRow key={room.meetingRoomId}>
                  <TableCell>{room.name}</TableCell>
                  <TableCell>{room.location ?? "-"}</TableCell>
                  <TableCell>{room.capacity ? `${room.capacity}명` : "-"}</TableCell>
                  <TableCell>{room.equipment ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/rooms/edit?id=${room.meetingRoomId}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      수정
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
