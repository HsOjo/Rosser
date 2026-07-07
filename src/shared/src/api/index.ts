import createClient from "openapi-fetch";
import type { paths } from "./types.js";

export type { paths };

let baseURL = "";
let authToken = "";

export function setBaseURL(url: string) {
  baseURL = url.replace(/\/$/, "");
}

export function setAuthToken(token: string) {
  authToken = token;
}

export function getBaseURL() {
  return baseURL;
}

export function getAuthToken() {
  return authToken;
}

export const api = createClient<paths>({
  baseUrl: baseURL || undefined,
  headers: {},
});

export function configureClient() {
  // Re-create client when config changes
  (api as any).baseUrl = baseURL;
  (api as any).headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

export function createConfiguredClient() {
  return createClient<paths>({
    baseUrl: baseURL || undefined,
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });
}
