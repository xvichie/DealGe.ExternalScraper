import { Router } from "express";
import { MyAutoComparableSearch } from "../types/myauto.types";
import { scrapeMyAutoPreview, scrapeMyAutoComparables, getMyAutoPriceEvaluation, getAllMyAutoListings } from "../scrapers/myauto/myauto.scraper";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     MyAutoComparableSearch:
 *       type: object
 *       required:
 *         - myAutoMakeId
 *         - myAutoModelId
 *       properties:
 *         myAutoVehicleTypeId:
 *           type: number
 *           example: 0
 *         myAutoForRent:
 *           type: number
 *           example: 0
 *         myAutoMakeId:
 *           type: number
 *           example: 3
 *         myAutoModelId:
 *           type: number
 *           example: 67
 *         yearFrom:
 *           type: number
 *           example: 2012
 *         yearTo:
 *           type: number
 *           example: 2016
 *         engineVolumeFrom:
 *           type: number
 *           example: 2000
 *         engineVolumeTo:
 *           type: number
 *           example: 2000
 *         mileageFrom:
 *           type: number
 *           example: 140000
 *         mileageTo:
 *           type: number
 *           example: 160000
 *         customs:
 *           type: number
 *           example: 1
 */

/**
 * @openapi
 * /myauto/preview:
 *   post:
 *     summary: Scrape MyAuto listing by URL
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
 *                 example: https://www.myauto.ge/ka/pr/12345678
 *     responses:
 *       200:
 *         description: Listing preview data
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
router.post("/preview", async (req, res) => {
  try {
    const { url } = req.body as { url?: string };

    if (!url) {
      return res.status(400).json({
        success: false,
        error: "url is required",
      });
    }

    // basic URL validation
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        error: "Invalid URL",
      });
    }

    const data = await scrapeMyAutoPreview(url);

    return res.status(200).json(data);
  } catch (error) {
    console.error("MyAuto preview error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to scrape MyAuto listing",
    });
  }
});

/**
 * @openapi
 * /myauto/comparables:
 *   post:
 *     summary: Fetch comparable listings from MyAuto
 *     tags:
 *       - MyAuto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MyAutoComparableSearch'
 *     responses:
 *       200:
 *         description: Comparable listings
 */
router.post("/comparables", async (req, res) => {
  const body = req.body as MyAutoComparableSearch;

  if (!body?.myAutoMakeId || !body?.myAutoModelId) {
    return res.status(400).json({
      error: "myAutoMakeId and myAutoModelId are required",
    });
  }

  try {
    const data = await scrapeMyAutoComparables(body);
    return res.json(data);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({
      error: e.message,
    });
  }
});

/**
 * @openapi
 * /myauto/price-evaluation:
 *   post:
 *     summary: Evaluate car price using MyAuto comparables
 *     tags:
 *       - MyAuto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - listingPrice
 *               - params
 *             properties:
 *               listingPrice:
 *                 type: number
 *                 example: 15000
 *               params:
 *                 $ref: '#/components/schemas/MyAutoComparableSearch'
 *     responses:
 *       200:
 *         description: Price evaluation result
 */
router.post("/price-evaluation", async (req, res) => {
  const { params, listingPrice } = req.body;

  if (!params) {
    return res.status(400).json({
      error: "params and listingPrice are required",
    });
  }

  try {
    const result = await getMyAutoPriceEvaluation(params, listingPrice);
    return res.json(result);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({
      error: e.message,
    });
  }
});

/**
 * @openapi
 * /myauto/listings:
 *   post:
 *     summary: Fetch ALL listings from MyAuto based on filters
 *     tags:
 *       - MyAuto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MyAutoComparableSearch'
 *     responses:
 *       200:
 *         description: All listings returned from MyAuto
 */
router.post("/listings", async (req, res) => {
  const body = req.body as MyAutoComparableSearch;

  console.log(body)

  if (!body?.myAutoMakeId || !body?.myAutoModelId) {
    return res.status(400).json({
      error: "myAutoMakeId and myAutoModelId are required",
    });
  }

  try {
    const listings = await getAllMyAutoListings(body);

    return res.json(listings);

  } catch (e: any) {
    console.error(e);

    return res.status(500).json({
      error: e.message,
    });
  }
});

export default router;