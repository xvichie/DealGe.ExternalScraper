"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeIaaiHtml = scrapeIaaiHtml;
const createBrowser_1 = require("../browsers/createBrowser");
async function scrapeIaaiHtml(url) {
    const { browser, page } = await (0, createBrowser_1.createBrowser)();
    try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
        // Wait for vehicle info section
        await page.waitForSelector(".data-list--details", {
            state: "attached",
            timeout: 15_000,
        });
        const data = await page.evaluate(() => {
            const getValue = (label) => {
                const item = [...document.querySelectorAll(".data-list__item")]
                    .find(li => li.querySelector(".data-list__label")?.textContent?.trim() === label);
                return item?.querySelector(".data-list__value")?.textContent?.trim() ?? null;
            };
            const images = [...document.querySelectorAll('[id^="imglnk_"]')]
                .map(a => a.getAttribute("data-code"))
                .filter(Boolean);
            return {
                title: document
                    .querySelector("#hdnYearMakeModelSeries")
                    ?.getAttribute("value") ?? null,
                stockNumber: getValue("Stock #:"),
                vinMasked: getValue("VIN (Status):"),
                odometer: getValue("Odometer:"),
                primaryDamage: getValue("Primary Damage:"),
                titleStatus: getValue("Title/Sale Doc:"),
                transmission: getValue("Transmission:"),
                driveType: getValue("Drive Line Type:"),
                fuelType: getValue("Fuel Type:"),
                cylinders: getValue("Cylinders:"),
                engine: getValue("Engine:"),
                exteriorInterior: getValue("Exterior/Interior:"),
                images
            };
        });
        return data;
    }
    finally {
        await browser.close();
    }
}
