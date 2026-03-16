import { AuctionData } from "../types/auctionHistory.types";
import * as cheerio from "cheerio";
import { createBrowserContext } from "../browsers/createBrowserContext";

export async function getBidMotorsAuctionDataByVinNumber(
  vin: string
): Promise<AuctionData | null> {

  const context = await createBrowserContext();
  const page = await context.newPage();

  try {

    console.log("VIN:", vin);

    const searchUrl = `https://bidmotors.bg/en/live-auction/search?query=${vin}`;

    console.log("Searching:", searchUrl);

    const response = await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    const body = await response?.text();

    if (!body) return null;

    const json = JSON.parse(body);

    if (!json.redirect_url) {
      console.log("VIN not found on BidMotors");
      return null;
    }

    const carUrl = `https://bidmotors.bg${json.redirect_url}`;

    console.log("Opening car page:", carUrl);

    await page.goto(carUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForSelector(".car-details__item", {
      timeout: 60000
    });

    const html = await page.content();
    const $ = cheerio.load(html);

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

    const images: string[] = [];

    $(".car-gallery a.image").each((_, el) => {
      const href = $(el).attr("href");
      if (href) images.push(href);
    });

    let price: number | null = null;

    const priceText = $(".auction-status__price")
      .first()
      .text()
      .trim();

    if (priceText) {
      const numeric = priceText.replace(/[^\d.]/g, "");
      price = numeric ? Number(numeric) : null;
    }

    const data: AuctionData = {
      DocType: getValue("Title") || getValue("Doc type"),
      CarStatus: null,

      Odometer: getValue("Mileage"),

      PrimaryDamage: getValue("Primary damage") || getValue("Damage"),
      SecondaryDamage: getValue("Secondary damage"),

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