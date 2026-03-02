import chromium from "@sparticuz/chromium";
import { chromium as pwChromium, Browser, Page } from "playwright-core";

function isLambda() {
  return !!process.env.AWS_LAMBDA_FUNCTION_NAME;
}

export async function createBrowser(): Promise<{
  browser: Browser;
  page: Page;
}> {
  const browser = isLambda()
    ? await pwChromium.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true,
      })
    : await pwChromium.launch({
        headless: true,
        executablePath: process.env.CHROME_PATH, // OR Playwright-installed chromium
      });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
  });

  // Anti-detection (safe & lightweight)
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });
  });

  const page = await context.newPage();

  return { browser, page };
}
