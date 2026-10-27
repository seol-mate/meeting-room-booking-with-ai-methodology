"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { FieldError } from "@/components/field-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin, useMe } from "@/hooks/use-auth";
import { isApiError } from "@/lib/api-error";
import { t } from "@/lib/messages";
import { fieldErrors, loginSchema } from "@/lib/schemas";

function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: me } = useMe();
  const login = useLogin();
  const [values, setValues] = useState({ loginId: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);

  // 이미 로그인한 사용자는 예약 현황으로 보낸다 (C-RSV-LGN-001)
  useEffect(() => {
    if (me) router.replace("/status");
  }, [me, router]);

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
      onError: (error) => setFailure(isApiError(error) ? error.message : t("rsv.login.submit.failed")),
    });
  }

  return (
    <>
      {params.get("reason") === "required" && (
        <Alert className="mb-4">
          <AlertDescription>{t("rsv.login.access.required")}</AlertDescription>
        </Alert>
      )}
      {params.get("joined") === "1" && (
        <Alert className="mb-4">
          <AlertDescription>{t("rsv.join.submit.success")}</AlertDescription>
        </Alert>
      )}
      {failure && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{failure}</AlertDescription>
        </Alert>
      )}
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="loginId">로그인 ID</Label>
          <Input
            id="loginId"
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
        <Button type="submit" size="lg" className="w-full" disabled={login.isPending}>
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
