import { MyAutoComparable, MyAutoComparableSearch, PriceEvaluation } from "../types/myauto.types";

export function extractMyAutoProductId(url: string): string {
  console.log(url)
  const match = url.match(/\/pr\/(\d+)/);
  if (!match) {
    throw new Error("Invalid MyAuto URL");
  }
  return match[1];
}

export function buildMyAutoComparablesQuery(params: MyAutoComparableSearch, page: number): string {
  const search = new URLSearchParams();

  const mileageType = params.mileageType ?? 1;
  const currencyId = params.currencyId ?? 1;

  if (params.myAutoVehicleTypeId)
    search.set("TypeID", params.myAutoVehicleTypeId?.toString());

  if(params.myAutoForRent)
    search.set("ForRent", params.myAutoForRent?.toString());

  // Mans = makeId.modelId
  search.set(
    "Mans",
    `${params.myAutoMakeId}.${params.myAutoModelId}`
  );

  if (params.yearFrom)
    search.set("ProdYearFrom", params.yearFrom.toString());

  if (params.yearTo)
    search.set("ProdYearTo", params.yearTo.toString());

  if (params.engineVolumeFrom)
    search.set("EngineVolumeFrom", params.engineVolumeFrom.toString());

  if (params.engineVolumeTo)
    search.set("EngineVolumeTo", params.engineVolumeTo.toString());

  if (params.mileageKmFrom)
    search.set("MileageFrom", params.mileageKmFrom.toString());

  if (params.mileageKmTo)
    search.set("MileageTo", params.mileageKmTo.toString());

  if (params.customs !== undefined && params.customs == 1)
    search.set("Customs", params.customs.toString());

  if(params.isInGeorgia)
    search.set("Locs", "2.3.4.7.15.30.113.53.39.38.37.36.40.41.44.31.5.47.48.52.8.54.16.6.14.13.12.11.10.9.55.56.57.59.58.61.62.63.64.66.71.72.74.75.76.77.78.80.81.82.83.84.85.86.87.88.91.96.97.101.109.116.119.122.127.131.133.137.139.143")
  else ;

  search.set("MileageType", mileageType.toString());
  search.set("CurrencyID", currencyId.toString());

  search.set("Page", page.toString());

  return search.toString();
}

export function median(values: number[]): number {

  if (values.length === 0)
    throw new Error("Cannot compute median of empty array");

  const sorted = [...values].sort((a, b) => a - b);

  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}


export function percentile(values: number[], p: number): number {

  if (values.length === 0)
    throw new Error("Cannot compute percentile of empty array");

  if (p < 0 || p > 1)
    throw new Error("Percentile must be between 0 and 1");

  const sorted = [...values].sort((a, b) => a - b);

  const index = (sorted.length - 1) * p;

  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper)
    return sorted[lower];

  const weight = index - lower;

  return (
    sorted[lower] * (1 - weight) +
    sorted[upper] * weight
  );
}

export function evaluatePrice(
  listingPrice: number,
  comparables: MyAutoComparable[]
): PriceEvaluation {

  const prices = comparables
    .map(x => x.price_usd)
    .filter(p => p > 0)
    .sort((a, b) => a - b);

  if (prices.length < 5) {
    throw new Error("Not enough comparables");
  }

  // Quartiles
  const p25 = percentile(prices, 0.25);
  const p75 = percentile(prices, 0.75);

  const iqr = p75 - p25;

  const lowerBound = p25 - 1.5 * iqr;
  const upperBound = p75 + 1.5 * iqr;

  // Remove outliers
  const filtered = prices.filter(
    p => p >= lowerBound && p <= upperBound
  );

  if (filtered.length < 3) {
    throw new Error("Too many outliers removed");
  }

  const medianPrice = median(filtered);

  const averagePrice =
    filtered.reduce((sum, p) => sum + p, 0) / filtered.length;

  const p25Filtered = percentile(filtered, 0.25);
  const p75Filtered = percentile(filtered, 0.75);

  const dealRatio = listingPrice / medianPrice;

  return {
    comparableCount: filtered.length,
    medianPrice,
    averagePrice,
    marketMin: p25Filtered,
    marketMax: p75Filtered,
    dealRatio
  };
}