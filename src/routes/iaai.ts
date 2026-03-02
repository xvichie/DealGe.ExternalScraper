import { Router } from "express";
import { scrapeCopartPreviewHtml } from "../scrapers/copart.scraper";
import { scrapeIaaiHtml } from "../scrapers/iaai.scraper";

const router = Router();

/**
 * @openapi
 * /iaai/preview:
 *   post:
 *     summary: Scrape iaai listing by URL
 *     description: >
 *       Uses Playwright to bypass Cloudflare and fetch raw MyAuto listing data.
 *       Returns the exact API payload (data.info).
 *     tags:
 *       - iaai
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 example: https://www.copart.com/lot/73701875/clean-title-2017-toyota-corolla-l-nb-moncton
 *     responses:
 *       200:
 *         description: Raw copart product JSON
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Scraping failed
 */
router.post("/preview", async (req, res) => {
  const { url } = req.body as { url?: string };

  if (!url) {
    return res.status(400).json({ error: "url is required" });
  }

  try {
    const data = await scrapeIaaiHtml(url);
    return res.json(data);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

export default router;
