import {
  ChainNativeSymbols,
  EncodedTransaction,
  MinimalAsset,
} from "@yasp/models";
import { LeverageProvider } from "../leverage-provider";
import { Hex } from "viem";
import { chainToAavePoolMapper } from "../constants";
import { FlashLoanProvider } from "../flashloan-provider";
import { SwapProvider } from "../swap-provider";

export class AaveLeverageProvider extends LeverageProvider {
  poolAddress: Hex;

  constructor(
    flashloan: FlashLoanProvider,
    swapper: SwapProvider,
    chain: ChainNativeSymbols
  ) {
    const pool = chainToAavePoolMapper[chain]!;

    if (!pool) {
      throw new Error(`Aave V3 is not supported on "${chain}" network`);
    }

    super(flashloan, swapper, chain);
    this.poolAddress = pool;
  }

  async positionOf(walletAddress: Hex): Promise<any> {
    return null;
  }

  async setup(
    collateral: MinimalAsset,
    dept: MinimalAsset
  ): Promise<EncodedTransaction[]> {
    return [];
  }

  async addCollateral(
    collateral: MinimalAsset,
    amount: string,
    walletAddress: Hex
  ): Promise<EncodedTransaction[]> {
    return [];
  }

  async removeCollateral(
    collateral: MinimalAsset,
    amount: string,
    walletAddress: Hex
  ): Promise<EncodedTransaction[]> {
    return [];
  }

  async addDept(
    dept: MinimalAsset,
    amount: string,
    walletAddress: Hex
  ): Promise<EncodedTransaction[]> {
    return [];
  }

  async removeDept(
    dept: MinimalAsset,
    amount: string,
    walletAddress: Hex
  ): Promise<EncodedTransaction[]> {
    return [];
  }
}
