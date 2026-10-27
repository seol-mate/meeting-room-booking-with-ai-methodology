import axios from "axios";

/** 공통 HTTP 클라이언트 — baseURL·인터셉터·에러 변환은 이 한 곳에서 처리한다. */
export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  timeout: 10_000,
  withCredentials: true,
});

http.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);
