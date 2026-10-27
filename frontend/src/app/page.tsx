import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">회의실 예약</h1>
      <p className="text-muted-foreground">개발환경이 준비되었습니다.</p>
      <Button>시작하기</Button>
    </main>
  );
}
