import { chromium, Browser } from "playwright";
import dotenv from "dotenv";

dotenv.config();

let browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROME_PATH,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    console.log("✅ Browser started");
  }

  return browser;
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}