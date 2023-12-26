import {
  ChainNativeSymbols,
  EncodedTransaction,
  MinimalAsset,
} from "@yasp/models";
import { Hex, encodeFunctionData, parseAbi } from "viem";

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
  constructor(public readonly chain: ChainNativeSymbols) {}
  abstract flashloan(params: FlashLoanParams): Promise<EncodedTransaction[]>;  
}
