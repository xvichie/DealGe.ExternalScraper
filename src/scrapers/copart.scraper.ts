import { createBrowserContext } from "../browsers/createBrowserContext";

export async function scrapeCopartPreviewHtml(url: string) {
  const context = await createBrowserContext();
  const page = await context.newPage();

  // ---------------- DEBUG HOOKS ----------------
  page.on("console", msg =>
    console.log(`[PAGE:${msg.type()}]`, msg.text())
  );

  page.on("pageerror", err =>
    console.error("[PAGE ERROR]", err.message)
  );

  page.on("requestfailed", req =>
    console.error(
      "[REQUEST FAILED]",
      req.url(),
      req.failure()?.errorText
    )
  );

  try {
    console.log("Opening:", url);

    await page.setViewportSize({ width: 1280, height: 900 });

    // ---------------- FIRST LOAD ----------------
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    // ---------------- WAIT FOR SOLR CACHE ----------------
    const waitForSolr = async () => {
      await page.waitForFunction(
        () => {
          const w = window as any;
          return (
            w.appInit &&
            typeof w.appInit.cachedSolrLotDetailsStr === "string" &&
            w.appInit.cachedSolrLotDetailsStr.length > 50
          );
        },
        { timeout: 10_000 }
      );
    };

    try {
      await waitForSolr();
    } catch {
      console.warn("Solr cache not found on first load, retrying with reload…");

      // ---------------- RELOAD FALLBACK ----------------
      await page.reload({
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });

      await waitForSolr();
    }

    // ---------------- EXTRACT RAW JSON ----------------
    const solrJson: string | null = await page.evaluate(() => {
      const w = window as any;
      return w.appInit?.cachedSolrLotDetailsStr ?? null;
    });

    if (!solrJson) {
      // Debug artifacts only when things go wrong
      // await page.screenshot({
      //   path: "copart-debug.png",
      //   fullPage: true,
      // });

      // const html = await page.content();
      // fs.writeFileSync("copart-debug.html", html);

      throw new Error("cachedSolrLotDetailsStr not available");
    }

    // ---------------- PARSE ----------------
    let lot: any;
    try {
      lot = JSON.parse(solrJson);
    } catch {
      // fs.writeFileSync("copart-solr-raw.txt", solrJson);
      // throw new Error("Failed to parse cachedSolrLotDetailsStr JSON");
    }

    // ---------------- MAP DATA ----------------
    const data = {
      lotNumber: lot.ln ?? null,
      title: lot.ld?.trim() ?? null,

      year: lot.lcy ?? null,
      make: lot.mkn ?? null,
      model: lot.lm ?? null,
      trim: lot.mtrim ?? null,

      vinMasked: lot.fv ?? null,

      odometer: lot.la ?? null,
      odometerUnit: lot.odometerUOM === "A" ? "miles" : null,

      engine: lot.egn ?? null,
      cylinders: lot.cy ?? null,
      fuel: lot.ft ?? null,
      drivetrain: lot.drv ?? null,
      transmission: lot.tmtp ?? null,

      color: lot.clr ?? null,
      hasKeys: lot.hk === "YES",

      primaryDamage: lot.dd ?? null,
      titleGroup: lot.tgd ?? null,
      titleCode: lot.td ?? null,

      auctionLocation: {
        yard: lot.yn ?? null,
        city: lot.locCity ?? null,
        state: lot.locState ?? null,
        country: lot.locCountry ?? null,
      },

      sale: {
        currency: lot.cuc ?? null,
        currentBid: lot.hb ?? null,
        saleStatus: lot.ess ?? null,
        saleDateUtc: lot.ad
          ? new Date(lot.ad).toISOString()
          : null,
      },

      images: lot.tims
        ? [String(lot.tims).replace("_thb", "_hrs")]
        : [],

      raw: lot,
    };

    console.log("SCRAPED DATA:", JSON.stringify(data, null, 2));
    console.log(await page.content());
    
    return data;
  } finally {
    await context.close();
  }
}
