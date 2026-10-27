/** 입력 필드 아래 인라인 오류 문구 */
export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} data-testid={id} role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}
