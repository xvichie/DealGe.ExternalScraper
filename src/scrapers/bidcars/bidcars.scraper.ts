import { createBrowserContext } from "../../browsers/createBrowserContext";
import { formatEngineSize, parseBidCarsDate } from "../../utils/formater.utils";
import { BidCarsGetAuctionDataRequest } from "./bidcars.requests";
import { BIDCARS_FILTER_KEYS } from "./bidcars.searchFilters";
import { BidCarsStartCode } from "./bidcars.types";

export async function getBidCarsAuctionData(request: BidCarsGetAuctionDataRequest) {

    const context = await createBrowserContext();
    const page = await context.newPage();

    try {

        const modelNoSpace = request.model.replace(/\s+/g, "");
        let result = await fetchBidCars(page, request, modelNoSpace);

        if (!result || result.length === 0) {
            const modelPlus = request.model.replace(/\s+/g, "+");
            result = await fetchBidCars(page, request, modelPlus);
        }

        if (!result)
            return null;

        normalizeFinalBids(result);

        return result;

    } finally {
        await context.close();
    }
}

async function fetchBidCars(page: any, request: BidCarsGetAuctionDataRequest, model: string) {

    const params = new URLSearchParams({
        [BIDCARS_FILTER_KEYS.SearchType]: "filters",
        [BIDCARS_FILTER_KEYS.Status]: "All",
        [BIDCARS_FILTER_KEYS.Type]: "Automobile",
        [BIDCARS_FILTER_KEYS.AuctionType]: "All",

        [BIDCARS_FILTER_KEYS.Make]: request.make,
        [BIDCARS_FILTER_KEYS.Model]: model,

        [BIDCARS_FILTER_KEYS.YearFrom]: request.yearFrom.toString(),
        [BIDCARS_FILTER_KEYS.YearTo]: request.yearTo.toString(),

        [BIDCARS_FILTER_KEYS.OdometerFrom]: request.odometerFrom.toString(),
        [BIDCARS_FILTER_KEYS.OdometerTo]: request.odometerTo.toString(),

        [BIDCARS_FILTER_KEYS.EngineSizeFrom]: formatEngineSize(request.engineSizeFrom),
        [BIDCARS_FILTER_KEYS.EngineSizeTo]: formatEngineSize(request.engineSizeTo),

        [BIDCARS_FILTER_KEYS.StartCode]: request.startCode ?? BidCarsStartCode.RunAndDrive
    });

    if (request.fuelType)
        params.set(BIDCARS_FILTER_KEYS.FuelType, request.fuelType);

    const query = params.toString().replace(/%2B/gi, "+");

    const url =
        `https://bid.cars/app/search/archived/request?${query}`;

    // console.log("BidCars API:", url);

    const response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000
    });

    const body = await response?.text();

    if (!body)
        return null;

    const json = JSON.parse(body);

    return json.data;
}

function normalizeFinalBids(cars: any[]) {

    for (const car of cars) {

        // skip if already a valid number
        if (typeof car.final_bid === "number" && car.final_bid > 0)
            continue;

        if (!car.final_bid_formatted)
            continue;

        const numeric = parseInt(
            car.final_bid_formatted.replace(/[^0-9]/g, "")
        );

        if (!isNaN(numeric) && numeric > 0) {
            car.final_bid = numeric;
        } else {
            car.final_bid = 0;
        }
    }
}

export async function getBidCarsUntilMatch(
    vin: string,
    lot: string,
    maxRecords = 500
) {
    const context = await createBrowserContext();
    const page = await context.newPage();

    const results: any[] = [];

    try {

        const perPage = 100;
        let currentPage = 1;

        while (results.length < maxRecords) {

            const params = new URLSearchParams({
                [BIDCARS_FILTER_KEYS.SearchType]: "filters",
                [BIDCARS_FILTER_KEYS.Status]: "All",
                [BIDCARS_FILTER_KEYS.Type]: "Automobile",
                [BIDCARS_FILTER_KEYS.AuctionType]: "All",

                [BIDCARS_FILTER_KEYS.Make]: "All",
                [BIDCARS_FILTER_KEYS.Model]: "All",

                [BIDCARS_FILTER_KEYS.YearFrom]: "1900",
                [BIDCARS_FILTER_KEYS.YearTo]: "2027",

                page: currentPage.toString(),
                "per-page": perPage.toString()
            });

            const url =
                `https://bid.cars/app/search/archived/request?${params.toString()}`;

            const response = await page.goto(url, {
                waitUntil: "domcontentloaded",
                timeout: 60000
            });

            const body = await response?.text();
            if (!body) break;

            const json = JSON.parse(body);
            const cars = json.data ?? [];

            if (cars.length === 0)
                break;

            for (const car of cars) {

                results.push(car);

                if (
                    car.vin?.toUpperCase() === vin.toUpperCase() &&
                    car.lot?.toString() === lot.toString()
                ) {
                    normalizeFinalBids(results);
                    return results;
                }

                if (results.length >= maxRecords) {
                    normalizeFinalBids(results);
                    return results;
                }
            }

            currentPage++;
        }

        normalizeFinalBids(results);

        return results;

    } finally {
        await context.close();
    }
}