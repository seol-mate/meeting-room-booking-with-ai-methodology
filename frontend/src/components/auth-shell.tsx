/** 로그인 전 화면 공통 틀: 가운데 정렬 카드 한 장 */
export function AuthShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <p className="text-center text-xl font-bold">회의실 예약</p>
        <div className="rounded-xl border bg-card p-6">
          <h1 className="mb-4 text-xl font-bold">{title}</h1>
          {children}
        </div>
      </div>
    </main>
  );
}
