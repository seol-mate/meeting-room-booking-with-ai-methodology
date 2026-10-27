"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { FieldError } from "@/components/field-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoginIdAvailability, useSignup } from "@/hooks/use-auth";
import { isApiError } from "@/lib/api-error";
import { t } from "@/lib/messages";
import { fieldErrors, signupSchema } from "@/lib/schemas";

export default function JoinPage() {
  const router = useRouter();
  const signup = useSignup();
  const availability = useLoginIdAvailability();
  const [values, setValues] = useState({ loginId: "", name: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);

  /** 로그인 ID 입력을 마치면 이미 쓰는 ID인지 미리 알려 준다 */
  function checkLoginId() {
    const loginId = values.loginId.trim();
    if (!loginId) return;
    availability.mutate(loginId, {
      onSuccess: ({ available }) =>
        setErrors((prev) => {
          const next = { ...prev };
          if (available) delete next.loginId;
          else next.loginId = t("rsv.join.id.duplicate");
          return next;
        }),
    });
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFailure(null);
    const parsed = signupSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    signup.mutate(parsed.data, {
      onSuccess: () => router.push("/login?joined=1"),
      onError: (error) => {
        if (isApiError(error) && error.status === 409) {
          setErrors({ loginId: t("rsv.join.id.duplicate") });
        } else {
          setFailure(t("rsv.join.submit.failed"));
        }
      },
    });
  }

  return (
    <AuthShell title="계정 가입">
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
            onBlur={checkLoginId}
          />
          <FieldError id="loginId-error" message={errors.loginId} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">이름</Label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            value={values.name}
            aria-invalid={Boolean(errors.name)}
            aria-describedby="name-error"
            onChange={(e) => setValues({ ...values, name: e.target.value })}
          />
          <FieldError id="name-error" message={errors.name} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            aria-invalid={Boolean(errors.password)}
            aria-describedby="password-error"
            onChange={(e) => setValues({ ...values, password: e.target.value })}
          />
          <FieldError id="password-error" message={errors.password} />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={signup.isPending}>
          가입
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className={buttonVariants({ variant: "link" })}>
          로그인으로 돌아가기
        </Link>
      </p>
    </AuthShell>
  );
}
