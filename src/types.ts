import { MinimalAsset } from "@yasp/models"


export type LeveragePosition = {
  collateral: MinimalAsset;
  collateralPrice: string;
  collateralAmount: string;
  collateralAmountUSD: string;

  dept: MinimalAsset;
  deptPrice: string;
  deptAmount: string;
  deptAmountUSD: string;

  ltv: number;
}