import { Page } from "playwright-core"
import { createBrowser } from "../browsers/createBrowser"
import { CarProblemSearchParams } from "../types/problemsScraper.types"
import { buildCarProblemSearchQuery, extractProblems, scrapeArticles, searchUrls } from "../utils/carProblems.utils"

export async function scrapeCarProblems(
  params: CarProblemSearchParams
) {

  const { browser, page } = await createBrowser()

  try {

    await page.goto("https://duckduckgo.com", {
      waitUntil: "domcontentloaded",
      timeout: 30000
    })

    await page.waitForTimeout(1200)

    const query = buildCarProblemSearchQuery(params)
    console.log("query:", query)

    const urls = await searchUrls(page, query)
    console.log("urls",urls)

    const texts = await scrapeArticles(page, urls)
    console.log("texts",texts)

    const problems = await extractProblems(params, texts)

    return problems

  } finally {
    await browser.close()
  }
}