import { MinimalAsset, TransactionPayload } from "@yasp/models";
import { Hex } from "viem";

export type FlashLoanAmount = {
  asset: MinimalAsset;
  amount: string;
};

export type FlashLoanParams = {
  assets: FlashLoanAmount[];
  receiver: Hex;
  payload: TransactionPayload;
};

export abstract class FlashLoanProvider {
  abstract flashloan(params: FlashLoanParams): Promise<TransactionPayload>;
}
