import createClient from "openapi-fetch";
import type { paths } from "./types.js";

export type { paths };

let _baseURL = "";
let _authToken = "";
let _client = createClient<paths>({ baseUrl: undefined, headers: {} });

function createClientInstance() {
  return createClient<paths>({
    baseUrl: _baseURL || undefined,
    headers: _authToken ? { Authorization: `Bearer ${_authToken}` } : {},
  });
}

function refreshClient() {
  _client = createClientInstance();
}

export function setBaseURL(url: string) {
  _baseURL = url.replace(/\/$/, "");
  refreshClient();
}

export function setAuthToken(token: string) {
  _authToken = token;
  refreshClient();
}

export function getBaseURL() {
  return _baseURL;
}

export function getAuthToken() {
  return _authToken;
}

export { _client as api };

export function createConfiguredClient() {
  return createClientInstance();
}
