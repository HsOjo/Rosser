import { defineConfig, devices } from "@playwright/test";

const E2E_BACKEND_PORT = "18000";
const E2E_BACKEND_TOKEN = "dev-token-change-me";
const E2E_BACKEND_DATA_DIR = "/tmp/rosser-e2e-data";

// 如果没有显式指定外部后端，则 E2E 测试使用独立的临时数据库，
// 避免删除/污染真实数据。
const useExternalBackend = !!process.env.ROSSER_API_URL;
const apiURL = useExternalBackend
  ? process.env.ROSSER_API_URL!
  : `http://localhost:${E2E_BACKEND_PORT}`;
const token = process.env.ROSSER_TOKEN || E2E_BACKEND_TOKEN;

process.env.ROSSER_API_URL = apiURL;
process.env.ROSSER_TOKEN = token;

const webServers: {
  command: string;
  url: string;
  reuseExistingServer: boolean;
  timeout: number;
}[] = [
  {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
];

if (!useExternalBackend) {
  webServers.push({
    command: `cd ../../ && ROSSER_PORT=${E2E_BACKEND_PORT} ROSSER_DATA_DIR=${E2E_BACKEND_DATA_DIR} ROSSER_TOKEN=${E2E_BACKEND_TOKEN} ROSSER_CORS_ORIGINS=http://localhost:5173 pnpm dev:backend`,
    url: `http://localhost:${E2E_BACKEND_PORT}/docs`,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  });
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: webServers as any,
});
