import { AuctionData } from "../types/auctionHistory.types";
import * as cheerio from "cheerio";
import { createBrowserContext } from "../browsers/createBrowserContext";

export async function getBidMotorsAuctionDataByVinNumber(
  vin: string
): Promise<AuctionData | null> {

  const startUrl = "https://bidmotors.bg/en";

  const context = await createBrowserContext();
  const page = await context.newPage();

  try {

    console.log("VIN:", vin);
    console.log("Opening:", startUrl);

    await page.goto(startUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    // allow SPA scripts to render
    await page.waitForTimeout(2000);

    // remove popup if it exists
    await page.evaluate(() => {
      document.querySelectorAll(".popup__dialog").forEach(el => el.remove());
      document.querySelectorAll(".modal-backdrop").forEach(el => el.remove());
    });

    // attempt clicking close button if still present
    try {
      const closeBtn = page.locator(".popup__btn-close");
      if (await closeBtn.isVisible({ timeout: 2000 })) {
        await closeBtn.click();
        console.log("Popup closed");
      }
    } catch { }

    const inputSelector = "#vin-lot-search";

    await page.waitForSelector(inputSelector, {
      state: "visible",
      timeout: 60000
    });

    await page.fill(inputSelector, vin);

    await Promise.all([
      page.waitForNavigation({ timeout: 60000, waitUntil: "domcontentloaded" }),
      page.keyboard.press("Enter")
    ]);

    await page.evaluate(() => {
      document.querySelectorAll(".popup__dialog").forEach(el => el.remove());
      document.querySelectorAll(".modal-backdrop").forEach(el => el.remove());
    });

    await Promise.race([
      page.waitForSelector(".car-details__item", { timeout: 60000 }),
      page.waitForSelector(".search-empty", { timeout: 60000 })
    ]);

    if (await page.locator(".search-empty").count()) {
      console.log("VIN not found on BidMotors");
      return null;
    }

    const html = await page.content();
    const $ = cheerio.load(html);

    /**
     * Helper to extract values from details table
     */
    const getValue = (label: string): string | null => {

      let result: string | null = null;

      $(".car-details__item").each((_, el) => {

        const key = $(el)
          .find(".car-details__label")
          .text()
          .trim()
          .toLowerCase();

        const value = $(el)
          .find(".car-details__value")
          .text()
          .trim();

        if (key.includes(label.toLowerCase())) {
          result = value || null;
        }

      });

      return result;

    };

    /**
     * Extract images
     */
    const images: string[] = [];

    $(".car-gallery a.image").each((_, el) => {
      const href = $(el).attr("href");
      if (href) images.push(href);
    });

    /**
     * Extract final price
     */
    let price: number | null = null;

    const priceText = $(".auction-status__price")
      .first()
      .text()
      .trim();

    if (priceText) {
      const numeric = priceText.replace(/[^\d.]/g, "");
      price = numeric ? Number(numeric) : null;
    }

    /**
     * Extract damages
     */
    const primaryDamage =
      getValue("Primary damage") || getValue("Damage");

    const secondaryDamage =
      getValue("Secondary damage");

    /**
     * Extract title
     */
    const title =
      getValue("Title") || getValue("Doc type");

    const data: AuctionData = {
      DocType: title,
      CarStatus: null,

      Odometer: getValue("Mileage"),

      PrimaryDamage: primaryDamage,
      SecondaryDamage: secondaryDamage,

      LastSaleImages: images,

      LastSaleDate: getValue("Auction date"),
      LastSaleLocation: "BidMotors",

      LastSaleAmountInUsd: price
    };

    console.log("SCRAPED BIDMOTORS:", data);

    return data;

  } catch (error) {

    console.error("BidMotors scraper error:", error);

    return null;

  } finally {

    await context.close();

  }

}