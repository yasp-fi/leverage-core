import { EncodedTransaction, MinimalAsset } from "@yasp/models";

export type ReserveInfo = {
  asset: MinimalAsset;
  ltv: number;
  liquidationThreshold: number;
  supplyApy: number;
  borrowApy: number;

  reserveSize: string;
  assetPrice: number;
  assetApy: number; // APY from LSTs
};

export type LeverageInfo = {
  collateral: ReserveInfo;
  dept: ReserveInfo;

  netApy: number;
  minLeverage: number;
  maxLeverage: number;

  ltv: number;
  apy: number;
  deptAmount: number;
  deptAmountUsd: number;
  collateralAmount: number;
  collateralAmountUsd: number;

  collateralPrice: number;
  liquidationPrice: number;
};

export type LeveragePayload = {
  
  transactions: EncodedTransaction[]
};

export type UserPosition = {
  collateral: ReserveInfo;
  dept: ReserveInfo;

  ltv: number;

  currentPrice: number;
  liquidationPrice: number;

  deptAmount: string;
  collateralAmount: string;
};
