export interface AuctionData {
  DocType: string | null;
  CarStatus: string | null;
  Odometer: string | null;
  PrimaryDamage: string | null;
  SecondaryDamage: string | null;

  LastSaleImages: string[];
  LastSaleDate: string | null;
  LastSaleLocation: string | null;
  LastSaleAmountInUsd: number | null;
}