"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { FieldError } from "@/components/field-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StateLoading } from "@/components/screen-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin, useMe } from "@/hooks/use-auth";
import { t } from "@/lib/messages";
import { fieldErrors, loginSchema } from "@/lib/schemas";

function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: me, error: meError, isPending } = useMe();
  const login = useLogin();
  const [values, setValues] = useState({ loginId: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);

  // 이미 로그인한 사용자는 예약 현황으로 보낸다 (C-RSV-LGN-001)
  // 갱신이 401로 실패하면 이전 data가 남아 있어도 보내지 않는다 — AuthGate와 서로 되돌려 보내는 무한 이동을 막는다
  useEffect(() => {
    if (me && !meError) router.replace("/status");
  }, [me, meError, router]);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFailure(null);
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    login.mutate(parsed.data, {
      onSuccess: () => router.replace("/status"),
      onError: () => setFailure(t("rsv.login.submit.failed")),
    });
  }

  // 로그인 상태를 확인하는 동안(또는 이미 로그인해 이동하는 동안)에는 폼 대신 로딩을 보인다 (UX-SCR-RSV-001-01)
  if (isPending || me) return <StateLoading />;

  return (
    <>
      {params.get("reason") === "required" && (
        <Alert className="mb-4" data-testid="notice">
          <AlertDescription>{t("rsv.login.access.required")}</AlertDescription>
        </Alert>
      )}
      {params.get("joined") === "1" && (
        <Alert className="mb-4" data-testid="notice">
          <AlertDescription>{t("rsv.join.submit.success")}</AlertDescription>
        </Alert>
      )}
      {failure && (
        <Alert variant="destructive" className="mb-4" data-testid="form-error">
          <AlertDescription>{failure}</AlertDescription>
        </Alert>
      )}
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="loginId">로그인 ID</Label>
          <Input
            id="loginId"
            data-testid="field-loginId"
            name="loginId"
            autoComplete="username"
            value={values.loginId}
            aria-invalid={Boolean(errors.loginId)}
            aria-describedby="loginId-error"
            onChange={(e) => setValues({ ...values, loginId: e.target.value })}
          />
          <FieldError id="loginId-error" message={errors.loginId} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            data-testid="field-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            aria-invalid={Boolean(errors.password)}
            aria-describedby="password-error"
            onChange={(e) => setValues({ ...values, password: e.target.value })}
          />
          <FieldError id="password-error" message={errors.password} />
        </div>
        <Button type="submit" size="lg" data-testid="submit-button" className="w-full" disabled={login.isPending}>
          로그인
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link href="/join" className={buttonVariants({ variant: "link" })}>
          계정 가입
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthShell title="로그인">
      <Suspense>
        <LoginView />
      </Suspense>
    </AuthShell>
  );
}
