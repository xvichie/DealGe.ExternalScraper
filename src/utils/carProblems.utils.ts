import { CarProblemSearchParams } from "../types/problemsScraper.types"
import * as cheerio from "cheerio"
import OpenAI from "openai";
import { Page } from "playwright-core";

export function buildCarProblemSearchQuery(params: CarProblemSearchParams) {
    const base = [
        params.carMakeName,
        params.carModelName,
        params.carProductionYear
    ]

    if (params.carGenerationName)
        base.push(params.carGenerationName)

    if (params.carEngineSize)
        base.push(`${params.carEngineSize}L`)

    if (params.carFuelType)
        base.push(params.carFuelType)

    return base.join(" ")
}

export async function searchUrls(page: Page, query: string) {

    const urls: string[] = []

    const queries = [
        `${query} common problems`,
        `${query} reliability issues`,
        `${query} known issues`,
        `${query} owner complaints`
    ]

    for (const q of queries) {

        const searchUrl =
            `https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`

        console.log("search:", searchUrl)

        await page.goto(searchUrl, {
            waitUntil: "domcontentloaded",
            timeout: 30000
        })

        const html = await page.content()
        console.log("HTML length:", html.length)
        console.log(html.slice(0, 2000))
        
        const $ = cheerio.load(html)

        $("a").each((_, el) => {

            const href = $(el).attr("href")
            if (!href) return

            let url = href

            // decode DuckDuckGo redirect
            if (href.startsWith("/l/?")) {
                const match = href.match(/uddg=([^&]+)/)
                if (match)
                    url = decodeURIComponent(match[1])
            }

            if (!url.startsWith("http")) return
            if (url.includes("duckduckgo")) return

            urls.push(url)

        })

        await page.waitForTimeout(500)
    }

    return [...new Set(urls)].slice(0, 6)
}

export async function scrapeArticles(page: any, urls: string[]) {

    const texts: string[] = []

    for (const url of urls) {

        try {

            console.log("Scraping:", url)

            const response = await page.request.get(url)

            if (!response.ok())
                continue

            const html = await response.text()

            const text = htmlToText(html)

            texts.push(`Source: ${url}\n${text}`)

            await page.waitForTimeout(500)

        } catch (e) {

            console.log("Failed:", url)

        }
    }

    return texts
}

export function htmlToText(html: string) {

    const $ = cheerio.load(html)

    $("script, style, img, svg, nav, footer, header, form").remove()

    const text = $("body")
        .text()
        .replace(/\s+/g, " ")
        .slice(0, 8000)

    return text
}

export async function extractProblems(
    params: CarProblemSearchParams,
    texts: string[]
) {

    const carDescription = [
        params.carMakeName,
        params.carModelName,
        params.carGenerationName,
        params.carProductionYear,
        `${params.carEngineSize}L`,
        params.carFuelType
    ]
        .filter(Boolean)
        .join(" ")

    const prompt = `
            The following articles discuss issues with this car:

            ${carDescription}

            Extract the most common mechanical or reliability problems.

            Return ONLY JSON:

            {
            "problems":[
            {
                "title":"",
                "description":"",
                "severity":"low|medium|high",
                "components":[]
            }
            ]
            }

            Articles:

            ${texts.join("\n\n")}
    `

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    })


    const completion =
        await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            temperature: 0.2,
            messages: [
                {
                    role: "system",
                    content:
                        "You extract structured vehicle reliability data."
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        })

    const response =
        completion.choices[0].message.content

    return JSON.parse(response ?? "{}")
}