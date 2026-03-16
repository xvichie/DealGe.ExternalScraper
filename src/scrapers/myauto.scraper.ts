import { createBrowserContext } from "../browsers/createBrowserContext";
import { MyAutoComparableSearch, MyAutoSearchResponse } from "../types/myauto.types";
import { buildMyAutoComparablesQuery, evaluatePrice, extractMyAutoProductId } from "../utils/myauto.utils";

export async function scrapeMyAutoPreview(url: string): Promise<any> {
  const productId = extractMyAutoProductId(url);

  if (!productId) {
    throw new Error("Invalid MyAuto URL (product id not found)");
  }

  const apiUrl = `https://api2.myauto.ge/ka/products/${productId}`;

  const context = await createBrowserContext();
  const page = await context.newPage();

  try {
    // 1️⃣ Open listing page (Cloudflare handshake happens here)
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
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
    console.log(json.data.info)
    return json.data.info;
  } finally {
    await context.close();
  }
}

const MAX_ITEMS = 200;

export async function scrapeMyAutoComparables(
  params: MyAutoComparableSearch
): Promise<any[]> {

  const context = await createBrowserContext();
  const page = await context.newPage();

  try {

    await page.goto("https://www.myauto.ge", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await page.waitForTimeout(1200);

    let currentPage = 1;
    let lastPage = 1;

    const results: any[] = [];

    do {

      const query = buildMyAutoComparablesQuery(params, currentPage);

      const apiUrl =
        `https://api2.myauto.ge/ka/products?${query}`;

      const response = await page.request.get(apiUrl, {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "ka,en-US;q=0.9,en;q=0.8",
          referer: "https://www.myauto.ge/",
        },
      });

      if (!response.ok()) {
        throw new Error(`MyAuto API failed: ${response.status()}`);
      }

      const json: MyAutoSearchResponse = await response.json();

      const items = json?.data?.items ?? [];

      results.push(...items);

      lastPage = json?.data.meta?.last_page ?? 1;

      currentPage++;

      if (results.length >= MAX_ITEMS)
        break;

      await page.waitForTimeout(500);

    } while (currentPage <= lastPage);

    //console.log(await page.content());
    return results.slice(0, MAX_ITEMS);

  } finally {
    await context.close();
  }
}

export async function getMyAutoPriceEvaluation(
  params: MyAutoComparableSearch,
  listingPrice: number
) {
  console.log(params)

  const comparables = await scrapeMyAutoComparables(params);

  const evaluation = evaluatePrice(listingPrice, comparables);

  return evaluation;
}