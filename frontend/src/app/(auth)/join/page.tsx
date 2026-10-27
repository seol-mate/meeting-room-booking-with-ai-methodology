import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ScreenState } from "@/components/screen-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function JoinPage() {
  return (
    <AuthShell title="계정 만들기">
      <ScreenState errorBanner="계정을 만들지 못했습니다.">
        <form className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="loginId">로그인 ID</Label>
            <Input id="loginId" name="loginId" autoComplete="username" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">이름</Label>
            <Input id="name" name="name" autoComplete="name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" size="lg" className="w-full">
            가입
          </Button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link href="/login" className={buttonVariants({ variant: "link" })}>
            로그인으로 돌아가기
          </Link>
        </p>
      </ScreenState>
    </AuthShell>
  );
}
