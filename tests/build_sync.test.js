import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { test, expect } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('build is up to date with source', () => {
  const rootDir = path.resolve(__dirname, '..');
  const inputPath = path.join(rootDir, 'input.js');
  const outputPath = path.join(rootDir, 'main.js');

  if (!fs.existsSync(inputPath)) {
    throw new Error('input.js not found');
  }

  if (!fs.existsSync(outputPath)) {
    expect(false, 'main.js does not exist. Please run npm run build.').toBe(true);
    return;
  }

  const inputStats = fs.statSync(inputPath);
  const outputStats = fs.statSync(outputPath);

  const inputMtime = inputStats.mtime.getTime();
  const outputMtime = outputStats.mtime.getTime();

  // 允许 2 秒的误差，以应对文件系统精度或构建过程中的微小延迟
  const isUpToDate = outputMtime >= inputMtime - 2000;

  expect(isUpToDate, `Build is out of date. input.js was modified at ${inputStats.mtime}, but main.js was last built at ${outputStats.mtime}. Please run "npm run build" before testing or releasing.`).toBe(true);
});
