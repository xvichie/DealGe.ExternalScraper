export interface MyAutoSearchResponse {
    data: {
        items: any[];
        meta: {
            total: number;
            per_page: number;
            current_page: number;
            last_page: number;
        };
    };
}

export interface MyAutoComparableSearch {
    myAutoVehicleTypeId?: number;
    myAutoForRent?: number;

    myAutoMakeId: number;
    myAutoModelId: number;

    yearFrom?: number;
    yearTo?: number;

    engineVolumeFrom?: number;
    engineVolumeTo?: number;

    mileageKmFrom?: number;
    mileageKmTo?: number;

    myAutoLocationId?: number;

    customs?: number;

    mileageType?: number;
    currencyId?: number;

    location?: boolean;
}

export interface PriceEvaluation {
  comparableCount: number;

  medianPrice: number;
  averagePrice: number;

  marketMin: number;
  marketMax: number;

  dealRatio: number;
}

export interface MyAutoComparable {
  price_usd: number;
  car_run_km: number;
  prod_year: number;
}