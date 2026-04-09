import { Router } from "express";
import { getBidMotorsAuctionDataByVinNumber } from "../scrapers/bidmotors/bidmotors.scraper";

const router = Router();

/**
 * @openapi
 * /bidmotors/vin:
 *   post:
 *     summary: Get auction history by VIN
 *     description: >
 *       Scrapes bidmotors.bg and returns auction information
 *       including mileage, auction date and images.
 *     tags:
 *       - bidmotors
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vin
 *             properties:
 *               vin:
 *                 type: string
 *                 example: WBA4J3C52KBL09724
 *     responses:
 *       200:
 *         description: Auction data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 DocType:
 *                   type: string
 *                 CarStatus:
 *                   type: string
 *                 Odometer:
 *                   type: string
 *                 PrimaryDamage:
 *                   type: string
 *                 SecondaryDamage:
 *                   type: string
 *                 LastSaleImages:
 *                   type: array
 *                   items:
 *                     type: string
 *                 LastSaleDate:
 *                   type: string
 *                 LastSaleLocation:
 *                   type: string
 *                 LastSaleAmountInUsd:
 *                   type: number
 *       400:
 *         description: Invalid request
 *       404:
 *         description: VIN not found
 *       500:
 *         description: Scraping failed
 */
  router.post("/vin", async (req, res) => {

  const { vin } = req.body as { vin?: string };

  console.log("vin", vin);

  if (!vin) {
    return res.status(400).json({ error: "vin is required" });
  }

  try {

    const data = await getBidMotorsAuctionDataByVinNumber(vin);

    if (!data) {
      return res.status(404).json({ error: "VIN not found" });
    }

    return res.json(data);

  } catch (e: any) {

    console.error(e);

    return res.status(500).json({
      error: e.message
    });

  }

});

export default router;