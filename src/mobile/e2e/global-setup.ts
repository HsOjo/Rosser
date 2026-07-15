import fs from "node:fs";

/**
 * E2E 测试独立数据目录。
 * 如果用户显式指定了 ROSSER_API_URL，则认为使用外部后端，不清理。
 */
const E2E_DATA_DIR = "/tmp/rosser-e2e-data";

export default async function globalSetup() {
  if (process.env.ROSSER_API_URL) {
    return;
  }

  // 每次启动前清空旧的测试数据，确保使用全新的数据库
  fs.rmSync(E2E_DATA_DIR, { recursive: true, force: true });
}
