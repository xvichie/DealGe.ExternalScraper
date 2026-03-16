import { BrowserContext } from "playwright";
import { getBrowser } from "./browserManager";

export async function createBrowserContext(): Promise<BrowserContext> {
  const browser = await getBrowser();

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
  });

  // Anti-bot fix
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });
  });

  return context;
}