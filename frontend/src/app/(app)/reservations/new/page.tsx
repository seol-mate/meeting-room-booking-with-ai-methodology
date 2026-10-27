import { AppShell } from "@/components/app-shell";
import { ScreenState } from "@/components/screen-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { allHalfHours } from "@/lib/time";
import { rooms, sampleDate } from "@/mock/data";

export default function NewReservationPage() {
  return (
    <AppShell title="회의실 예약">
      <ScreenState errorBanner="예약을 등록하지 못했습니다.">
        <form className="max-w-lg space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="room">회의실</Label>
            <NativeSelect id="room" name="room" defaultValue="">
              <option value="" disabled>
                선택해 주세요
              </option>
              {rooms.map((r) => (
                <option key={r.meetingRoomId} value={r.meetingRoomId}>
                  {r.name} ({r.location}, {r.capacity}명)
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date">날짜</Label>
            <Input id="date" name="date" type="date" defaultValue={sampleDate} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start">시작</Label>
              <NativeSelect id="start" name="start" defaultValue="09:00">
                {allHalfHours.map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end">종료</Label>
              <NativeSelect id="end" name="end" defaultValue="10:00">
                {allHalfHours.map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            30분 단위로 최소 30분, 최대 4시간까지 예약할 수 있습니다.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="title">회의 제목</Label>
            <Input id="title" name="title" />
          </div>
          <Button type="submit" size="lg">
            예약하기
          </Button>
        </form>
      </ScreenState>
    </AppShell>
  );
}
