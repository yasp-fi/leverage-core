import {
  ChainNativeSymbols,
  EncodedTransaction,
  MinimalAsset,
  TransactionPayload,
} from "@yasp/models";
import { Hex } from "viem";

export type FlashLoanAmount = {
  asset: MinimalAsset;
  amount: string;
};

export type FlashLoanParams = {
  assets: FlashLoanAmount[];
  receiver: Hex;
  payload: Hex;
};

export abstract class FlashLoanProvider {
  constructor(readonly chain: ChainNativeSymbols) {}
  abstract flashloan(params: FlashLoanParams): Promise<EncodedTransaction>;
}
