import { StateLoading } from "@/components/screen-state";

/** 로그인 전 화면 전환 중 보이는 로딩 상태 */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-sm px-4 py-12">
      <StateLoading />
    </div>
  );
}
