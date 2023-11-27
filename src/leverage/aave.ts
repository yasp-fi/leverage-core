import { EncodedTransaction, MinimalAsset } from "@yasp/models";
import { LeverageProvider } from "../leverage-provider";
import { Hex } from "viem";

export class AaveLeverageProvider extends LeverageProvider {
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
