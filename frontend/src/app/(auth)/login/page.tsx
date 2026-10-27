import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ScreenState } from "@/components/screen-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <AuthShell title="로그인">
      <ScreenState errorBanner="로그인 정보가 올바르지 않습니다.">
        <form className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="loginId">로그인 ID</Label>
            <Input id="loginId" name="loginId" autoComplete="username" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" size="lg" className="w-full">
            로그인
          </Button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link href="/join" className={buttonVariants({ variant: "link" })}>
            계정 만들기
          </Link>
        </p>
      </ScreenState>
    </AuthShell>
  );
}
