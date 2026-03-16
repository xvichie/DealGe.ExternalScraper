import fs from "fs";
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

    console.log("Opening:", startUrl);

    await page.goto(startUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    const inputSelector = "#vin-lot-search";

    await page.waitForSelector(inputSelector, { timeout: 15000 });

    await page.type(inputSelector, vin);

    await page.keyboard.press("Enter");

    await Promise.race([
      page.waitForFunction(
        (vin) => window.location.href.toLowerCase().includes(vin.toLowerCase()),
        vin,
        { timeout: 30000 }
      ),
      page.waitForSelector(".car-details__item", { timeout: 60000 })
    ]);

    const currentUrl = page.url();

    if (!currentUrl.toLowerCase().includes(vin.toLowerCase())) {
      console.log("VIN not found on BidMotors");
      return null;
    }

    console.log("Redirected to:", currentUrl);

    const html = await page.content();
    const $ = cheerio.load(html);

    /**
     * Helper to read values from car details table
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

    const priceText = $(".auction-status__price").first().text().trim();

    if (priceText) {
      const numeric = priceText.replace(/[^\d.]/g, "");
      price = numeric ? Number(numeric) : null;
    }

    /**
     * Extract damages
     */
    const primaryDamage = getValue("Primary damage") || getValue("Damage");
    const secondaryDamage = getValue("Secondary damage");

    /**
     * Extract title type
     */
    const title = getValue("Title") || getValue("Doc type");

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
    // console.log(await page.content());

    return data;

  } catch (err) {
    throw err;
  } finally {
    await context.close();
  }
}