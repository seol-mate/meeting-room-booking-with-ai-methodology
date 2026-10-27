import axios from "axios";

/** 공통 HTTP 클라이언트 — baseURL·인터셉터·에러 변환은 이 한 곳에서 처리한다. */
export const http = axios.create({
  // 기본은 같은 출처("/") — next.config.ts의 rewrites가 /api/* 를 백엔드로 넘긴다(세션 쿠키가 같은 출처로 유지된다)
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/",
  timeout: 10_000,
  withCredentials: true,
});

http.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);
