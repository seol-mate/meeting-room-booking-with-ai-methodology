import { StateLoading } from "@/components/screen-state";

/** 로그인 후 화면 전환 중 보이는 로딩 상태 */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <StateLoading />
    </div>
  );
}
