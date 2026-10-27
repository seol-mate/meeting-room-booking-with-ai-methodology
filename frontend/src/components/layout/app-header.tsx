"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import type { LoginUser } from "@/types/domain";

const userNav = [
  { href: "/status", label: "예약 현황" },
  { href: "/reservations/new", label: "회의실 예약" },
  { href: "/my-reservations", label: "내 예약" },
];

/** 관리 메뉴는 ROOM_MANAGER에게만 노출한다 (C-CMN-04) */
const managerNav = [
  { href: "/admin/rooms", label: "회의실 관리" },
  { href: "/admin/reservations", label: "전체 예약" },
];

/** 로그인 후 화면 공통 헤더 — 서비스명, 역할별 메뉴, 사용자 이름 (로그아웃은 요구사항에 없어 두지 않는다 — 5-IM-22 기각 결정) */
export function AppHeader({ user }: { user: LoginUser }) {
  const pathname = usePathname();
  const nav = user.role === "ROOM_MANAGER" ? [...userNav, ...managerNav] : userNav;

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/status" className="text-lg font-bold">
          회의실 예약
        </Link>
        <nav aria-label="주 메뉴" className="order-3 flex w-full flex-wrap gap-1 md:order-none md:w-auto md:flex-1">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={buttonVariants({ variant: active ? "secondary" : "ghost", size: "sm" })}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span>{user.name}</span>
        </div>
      </div>
    </header>
  );
}
