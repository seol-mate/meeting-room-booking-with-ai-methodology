import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { currentUser } from "@/mock/data";

const userNav = [
  { href: "/status", label: "예약 현황" },
  { href: "/reservations/new", label: "회의실 예약" },
  { href: "/my-reservations", label: "내 예약" },
];

const managerNav = [
  { href: "/admin/rooms", label: "회의실 관리" },
  { href: "/admin/reservations", label: "전체 예약" },
];

/** 로그인 후 화면 공통 틀: 상단 헤더(서비스명·사용자·로그아웃)와 역할별 메뉴 */
export function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const nav =
    currentUser.role === "ROOM_MANAGER" ? [...userNav, ...managerNav] : userNav;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/status" className="text-lg font-bold">
            회의실 예약
          </Link>
          <nav aria-label="주 메뉴" className="order-3 flex w-full flex-wrap gap-1 md:order-none md:w-auto md:flex-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span>{currentUser.name}</span>
            <Button variant="outline" size="sm" type="button">
              로그아웃
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold">{title}</h1>
        {children}
      </main>
    </div>
  );
}
