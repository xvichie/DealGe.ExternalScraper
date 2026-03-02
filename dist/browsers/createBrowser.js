"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBrowser = createBrowser;
const chromium_1 = __importDefault(require("@sparticuz/chromium"));
const playwright_core_1 = require("playwright-core");
function isLambda() {
    return !!process.env.AWS_LAMBDA_FUNCTION_NAME;
}
async function createBrowser() {
    const browser = isLambda()
        ? await playwright_core_1.chromium.launch({
            args: chromium_1.default.args,
            executablePath: await chromium_1.default.executablePath(),
            headless: true,
        })
        : await playwright_core_1.chromium.launch({
            headless: true,
            executablePath: process.env.CHROME_PATH, // OR Playwright-installed chromium
        });
    const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
    });
    // Anti-detection (safe & lightweight)
    await context.addInitScript(() => {
        Object.defineProperty(navigator, "webdriver", {
            get: () => undefined,
        });
    });
    const page = await context.newPage();
    return { browser, page };
}
