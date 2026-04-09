export interface BidCarsGetAuctionDataRequest {
  make: string
  model: string
  parentTitleGroup?: string

  odometerFrom: number
  odometerTo: number

  yearFrom: number
  yearTo: number

  fuelType?: string
  startCode?: string

  engineSizeFrom: number
  engineSizeTo: number
}