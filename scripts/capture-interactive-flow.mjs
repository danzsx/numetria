import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4173';
const outDir = path.resolve('pngprovas');
fs.mkdirSync(outDir, { recursive: true });

const candidates = [
  process.env.EDGE_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].filter(Boolean);

const executablePath = candidates.find((p) => fs.existsSync(p));
if (!executablePath) {
  throw new Error('Nao encontrei Edge/Chrome instalado para executar screenshots.');
}

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

async function shot(name) {
  const file = path.join(outDir, name);
  await page.screenshot({ path: file, fullPage: true });
  console.log('saved', file);
}

function normalizeNumber(text) {
  const only = String(text || '').replace(/[^0-9-]/g, '');
  if (!only) return NaN;
  return Number(only);
}

function compute(a, op, b) {
  if (op.includes('×') || op.includes('x') || op.includes('*')) return a * b;
  if (op.includes('÷') || op.includes('/')) return Math.trunc(a / b);
  if (op.includes('+')) return a + b;
  if (op.includes('-')) return a - b;
  throw new Error(`Operador nao suportado: ${op}`);
}

await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
await page.fill('#email', 'danilofortunato2011@gmail.com');
await page.fill('#password', '123456789');

await Promise.all([
  page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 20000 }),
  page.getByRole('button', { name: 'Entrar' }).click(),
]);

await page.goto(`${baseUrl}/modules`, { waitUntil: 'networkidle' });
await shot('01-modules-list.png');

await page.goto(`${baseUrl}/modules/foundational`, { waitUntil: 'networkidle' });
await shot('02-module-foundational-detail.png');

await page.getByRole('button', { name: 'Refazer modulo' }).click();
await page.waitForURL(/\/tabuada\/training/);
await page.waitForTimeout(800);
await shot('03-training-aula-1.png');

for (let i = 0; i < 40; i += 1) {
  if (page.url().includes('/tabuada/result')) break;

  const inputVisible = await page
    .locator('input[type="text"]')
    .first()
    .isVisible({ timeout: 4000 })
    .catch(() => false);
  if (!inputVisible) {
    await page.waitForTimeout(500);
    continue;
  }

  const data = await page.evaluate(() => {
    const container = document.querySelector('div.w-full.max-w-md') || document.body;
    const text = (container.textContent || '').split('\n').map((t) => t.trim()).filter(Boolean);
    const nums = text.filter((t) => /^-?\d[\d\s.,]*$/.test(t.replace(/\u00a0/g, '')));
    const line = text.find((t) => /[×x*÷/+-]\s*-?\d/.test(t));

    return {
      n1: nums[0] || '',
      line: line || '',
    };
  });

  const a = normalizeNumber(data.n1);
  const match = data.line.match(/([×x*÷/+-])\s*(-?[\d\s.,]+)/);
  if (!Number.isFinite(a) || !match) {
    throw new Error(`Nao consegui ler o problema atual: ${JSON.stringify(data)}`);
  }

  const op = match[1];
  const b = normalizeNumber(match[2]);
  const answer = compute(a, op, b);

  await page.locator('input[type="text"]').first().fill(String(answer));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1300);
}

await page.waitForURL(/\/tabuada\/result/, { timeout: 20000 });
await page.waitForTimeout(500);
await shot('04-lesson-result.png');

const nextButton = page.getByRole('button', { name: /Iniciar proxima aula/i });
if (await nextButton.count()) {
  await nextButton.first().click();
  await page.waitForURL(/\/tabuada\/training/, { timeout: 15000 });
  await page.waitForTimeout(800);
  await shot('05-training-aula-2.png');
}

await browser.close();
console.log('Fluxo capturado com sucesso em', outDir);
