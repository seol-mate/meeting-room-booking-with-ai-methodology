"use client";

import { useEffect, useState } from "react";
import { nowLocal } from "@/lib/time";

/** 지금 시각("YYYY-MM-DDTHH:mm")을 30초마다 갱신해 돌려준다 — 시작 시각이 지난 예약의 [취소]를 비활성으로 바꾸는 데 쓴다 */
export function useNow(): string {
  const [now, setNow] = useState(() => nowLocal());
  useEffect(() => {
    const timer = setInterval(() => setNow(nowLocal()), 30_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
