import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ScreenState } from "@/components/screen-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rooms } from "@/mock/data";

export default function RoomEditPage() {
  const room = rooms[0];

  return (
    <AppShell title="회의실 등록·변경">
      <ScreenState errorBanner="회의실 정보를 저장하지 못했습니다.">
        <form className="max-w-lg space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">회의실명</Label>
            <Input id="name" name="name" defaultValue={room.name} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">위치</Label>
            <Input id="location" name="location" defaultValue={room.location} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="capacity">수용 인원</Label>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              defaultValue={room.capacity}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="equipment">비품</Label>
            <Input id="equipment" name="equipment" defaultValue={room.equipment} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="lg">
              저장
            </Button>
            <Link
              href="/admin/rooms"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              목록으로
            </Link>
          </div>
        </form>
      </ScreenState>
    </AppShell>
  );
}
