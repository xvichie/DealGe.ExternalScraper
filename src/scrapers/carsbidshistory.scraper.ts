import { AuctionData } from "../types/auctionHistory.types";
import * as cheerio from "cheerio";
import { createBrowserContext } from "../browsers/createBrowserContext";

export async function getAuctionDataByVinNumber(
  vin: string
): Promise<AuctionData | null> {

  const url = `https://carsbidshistory.com/make/15/31/2020_3_3_3_3_3_+${vin}`;
  const context = await createBrowserContext();
  const page = await context.newPage();

  try {

    console.log("Opening:", url);

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    const html = await page.content();

    if (html.includes("404 Not Found")) {
      console.log("VIN not found");
      return null;
    }

    const $ = cheerio.load(html);

    const getCell = (label: string): string | null => {

      let result: string | null = null;

      $("table.table-striped tr").each((_, el) => {

        const key = $(el).find("td").eq(0).text().trim();
        const value = $(el).find("td").eq(1).text().trim();

        if (key.toLowerCase().includes(label.toLowerCase())) {
          result = value || null;
        }

      });

      return result;
    };

    // images
    const images: string[] = [];

    $("#carousel-bounding-box-0 img").each((_, el) => {
      const src = $(el).attr("src");
      if (src) images.push(src);
    });

    // last sale
    const saleRow = $("#resultTable tbody tr").first();

    const saleDate = saleRow.find("td").eq(1).text().trim() || null;
    const saleLocation = saleRow.find("td").eq(2).text().trim() || null;

    const bidText = saleRow.find("td").eq(5).text().trim();
    const saleAmount = bidText ? Number(bidText) : null;

    const data: AuctionData = {
      DocType: getCell("Doc Type"),
      CarStatus: getCell("Car Status"),
      Odometer: getCell("Odometer"),
      PrimaryDamage: getCell("Primary Damage"),
      SecondaryDamage: getCell("Secondary Damage"),

      LastSaleImages: images,
      LastSaleDate: saleDate,
      LastSaleLocation: saleLocation,
      LastSaleAmountInUsd: saleAmount
    };

    console.log("SCRAPED:", data);

    return data;

  } catch (err) {

    // await page.screenshot({
    //   path: "carsbidshistory-debug.png",
    //   fullPage: true
    // });

    // const html = await page.content();
    // fs.writeFileSync("carsbidshistory-debug.html", html);

    throw err;
  } finally {
    await context.close();
  }
}