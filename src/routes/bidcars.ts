import { Router } from "express";
import { getBidCarsAuctionData, getBidCarsUntilMatch } from "../scrapers/bidcars/bidcars.scraper";
import { BidCarsGetAuctionDataRequest } from "../scrapers/bidcars/bidcars.requests";

const router = Router();

/**
 * @openapi
 * /bidcars/search:
 *   post:
 *     summary: Get auction data from BidCars
 *     description: >
 *       Queries bid.cars archived auction database using filters
 *       such as make, model, year range and mileage range.
 *     tags:
 *       - bidcars
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - make
 *               - model
 *               - odometerFrom
 *               - odometerTo
 *               - yearFrom
 *               - yearTo
 *               - engineSizeFrom
 *               - engineSizeTo
 *             properties:
 *               make:
 *                 type: string
 *                 example: BMW
 *               model:
 *                 type: string
 *                 example: 3 Series
 *               parentTitleGroup:
 *                 type: string
 *                 example: Clean Title
 *               odometerFrom:
 *                 type: number
 *                 example: 80000
 *               odometerTo:
 *                 type: number
 *                 example: 100000
 *               yearFrom:
 *                 type: number
 *                 example: 2016
 *               yearTo:
 *                 type: number
 *                 example: 2016
 *               fuelType:
 *                 type: string
 *                 example: Gasoline
 *               startCode:
 *                 type: string
 *                 example: Run / Drive
 *               engineSizeFrom:
 *                 type: number
 *                 example: 2
 *               engineSizeTo:
 *                 type: number
 *                 example: 3
 *     responses:
 *       200:
 *         description: Auction results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Scraping failed
 */
router.post("/search", async (req, res) => {

  const request = req.body as BidCarsGetAuctionDataRequest;

  if (!request.make || !request.model) {
    return res.status(400).json({
      error: "make and model are required"
    });
  }

  try {

    const data = await getBidCarsAuctionData(request);

    return res.json(data);

  } catch (e: any) {

    console.error(e);

    return res.status(500).json({
      error: e.message
    });

  }

});

/**
 * @openapi
 * /bidcars/find:
 *   post:
 *     summary: Scan bid.cars archive until a listing is found
 *     description: >
 *       Scans archived auction listings from bid.cars until a listing
 *       with the provided VIN and lot number is found.
 *       Stops after scanning 10,000 records.
 *     tags:
 *       - bidcars
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vin
 *               - lot
 *             properties:
 *               vin:
 *                 type: string
 *                 example: JTJTBCDX5R5025053
 *               lot:
 *                 type: string
 *                 example: 0-41288607
 *     responses:
 *       200:
 *         description: Matching listing found
 *       404:
 *         description: Listing not found in scanned results
 *       500:
 *         description: Scraping failed
 */
router.post("/find", async (req, res) => {

  const { vin, lot } = req.body as { vin?: string; lot?: string };

  if (!vin || !lot) {
    return res.status(400).json({
      error: "vin and lot are required"
    });
  }

  try {

    const listings = await getBidCarsUntilMatch(vin, lot);

    const match = listings?.find(
      x =>
        x.vin?.toUpperCase() === vin.toUpperCase() &&
        x.lot?.toString() === lot.toString()
    );

    if (!match) {
      return res.status(404).json({
        error: "Listing not found within 10k records"
      });
    }

    return res.json(match);

  } catch (e: any) {

    console.error(e);

    return res.status(500).json({
      error: e.message
    });

  }

});

export default router;