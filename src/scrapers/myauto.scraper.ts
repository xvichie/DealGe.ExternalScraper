import { createBrowser } from "../browsers/createBrowser";
import { extractMyAutoProductId } from "../utils/myauto.utils";

export async function scrapeMyAutoPreview(url: string): Promise<any> {
  const productId = extractMyAutoProductId(url);

  if (!productId) {
    throw new Error("Invalid MyAuto URL (product id not found)");
  }

  const apiUrl = `https://api2.myauto.ge/ka/products/${productId}`;

  const { browser, page } = await createBrowser();

  try {
    // 1️⃣ Open listing page (Cloudflare handshake happens here)
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    // 2️⃣ Small deterministic delay (NOT networkidle)
    await page.waitForTimeout(1200);

    // 3️⃣ Call MyAuto API using browser request context
    const response = await page.request.get(apiUrl, {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "ka,en-US;q=0.9,en;q=0.8",
        referer: url,
      },
    });

    if (!response.ok()) {
      throw new Error(`MyAuto API failed: ${response.status()}`);
    }

    const json = await response.json();

    if (!json?.data?.info) {
      throw new Error("Invalid MyAuto API response: data.info missing");
    }

    // ✅ Return RAW MyAuto product info only
    return json.data.info;
  } finally {
    await browser.close();
  }
}
