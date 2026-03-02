"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const myauto_scraper_1 = require("../scrapers/myauto.scraper");
const router = (0, express_1.Router)();
/**
 * @openapi
 * /myauto/preview:
 *   post:
 *     summary: Scrape MyAuto listing by URL
 *     description: >
 *       Uses Playwright to bypass Cloudflare and fetch raw MyAuto listing data.
 *       Returns the exact API payload (data.info).
 *     tags:
 *       - MyAuto
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
 *                 example: https://www.myauto.ge/ka/pr/120323539
 *     responses:
 *       200:
 *         description: Raw MyAuto product JSON
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
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: "url is required" });
    }
    try {
        const data = await (0, myauto_scraper_1.scrapeMyAutoPreview)(url);
        return res.json(data);
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ error: e.message });
    }
});
exports.default = router;
