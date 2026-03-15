import { Router } from "express";
import { scrapeCarProblems } from "../scrapers/carProblems.scraper";
import { CarProblemSearchParams } from "../types/problemsScraper.types";

const router = Router();

/**
 * @openapi
 * /car-problems:
 *   post:
 *     summary: Get common problems for a specific car
 *     description: >
 *       Searches the web for reliability information and extracts common
 *       mechanical problems using AI.
 *     tags:
 *       - car-problems
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - carMakeName
 *               - carModelName
 *               - carProductionYear
 *               - carEngineSize
 *             properties:
 *               carMakeName:
 *                 type: string
 *                 example: BMW
 *               carModelName:
 *                 type: string
 *                 example: 3 Series
 *               carGenerationName:
 *                 type: string
 *                 example: E46
 *               carProductionYear:
 *                 type: number
 *                 example: 2003
 *               carEngineSize:
 *                 type: number
 *                 example: 2.5
 *               carFuelType:
 *                 type: string
 *                 example: gasoline
 *               carDrivetrainType:
 *                 type: string
 *                 example: rwd
 *     responses:
 *       200:
 *         description: Extracted common problems
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 problems:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       severity:
 *                         type: string
 *                         enum: [low, medium, high]
 *                       components:
 *                         type: array
 *                         items:
 *                           type: string
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Scraping failed
 */

router.post("/", async (req, res) => {
  const params = req.body as CarProblemSearchParams;

  if (
    !params?.carMakeName ||
    !params?.carModelName ||
    !params?.carProductionYear ||
    !params?.carEngineSize
  ) {
    return res.status(400).json({
      error:
        "carMakeName, carModelName, carProductionYear and carEngineSize are required",
    });
  }

  try {
    const data = await scrapeCarProblems(params);

    return res.json(data);

  } catch (e: any) {

    console.error(e);

    return res.status(500).json({
      error: e.message ?? "Scraping failed",
    });

  }
});

export default router;