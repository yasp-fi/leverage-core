import {
  Asset,
  ChainNativeSymbols,
  EncodedTransaction,
  MinimalAsset,
} from "@yasp/models";
import { LeverageProvider } from "../leverage-provider";
import { Hex, encodeFunctionData, parseUnits } from "viem";
import { AAVE_REFERRAL_CODE, chainToAavePoolMapper } from "../constants";
import { FlashLoanProvider } from "../flashloan-provider";
import { SwapProvider } from "../swap-provider";
import { AAVE_POOL_ABI } from "../abis";

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
    // TODO: add setUserEMode for better ltv value and bigger Leverages
    return [];
  }

  async addCollateral(
    collateral: MinimalAsset,
    amount: string,
    walletAddress: Hex
  ): Promise<EncodedTransaction[]> {
    const assetAddress = Asset.onChainAddress(collateral, this.chain) as Hex;
    const weiAmount = parseUnits(
      amount,
      Asset.decimals(collateral, this.chain)
    );

    return [
      {
        chain: this.chain,
        transactionType: "LEVERAGE_SUPPLY",
        transactionLabel: `Supply ${amount} ${collateral.symbol} on Aave`,
        transactionValue: "0",
        payload: encodeFunctionData({
          abi: AAVE_POOL_ABI,
          functionName: "supply",
          args: [assetAddress, weiAmount, walletAddress, AAVE_REFERRAL_CODE],
        }),
        address: {
          fromAddress: walletAddress,
          toAddress: this.poolAddress,
        },
      },
    ];
  }

  async removeCollateral(
    collateral: MinimalAsset,
    amount: string,
    walletAddress: Hex
  ): Promise<EncodedTransaction[]> {
    const assetAddress = Asset.onChainAddress(collateral, this.chain) as Hex;
    const weiAmount = parseUnits(
      amount,
      Asset.decimals(collateral, this.chain)
    );

    return [
      {
        chain: this.chain,
        transactionType: "LEVERAGE_WITHDRAW",
        transactionLabel: `Withdraw ${amount} ${collateral.symbol} on Aave`,
        transactionValue: "0",
        payload: encodeFunctionData({
          abi: AAVE_POOL_ABI,
          functionName: "withdraw",
          args: [assetAddress, weiAmount, walletAddress],
        }),
        address: {
          fromAddress: walletAddress,
          toAddress: this.poolAddress,
        },
      },
    ];
  }

  async addDept(
    dept: MinimalAsset,
    amount: string,
    walletAddress: Hex
  ): Promise<EncodedTransaction[]> {
    const assetAddress = Asset.onChainAddress(dept, this.chain) as Hex;
    const weiAmount = parseUnits(amount, Asset.decimals(dept, this.chain));
    const interestRateMode = BigInt(1); // Variable interest rate;

    return [
      {
        chain: this.chain,
        transactionType: "LEVERAGE_REPAY",
        transactionLabel: `Repay ${amount} ${dept.symbol} on Aave`,
        transactionValue: "0",
        payload: encodeFunctionData({
          abi: AAVE_POOL_ABI,
          functionName: "repay",
          args: [assetAddress, weiAmount, interestRateMode, walletAddress],
        }),
        address: {
          fromAddress: walletAddress,
          toAddress: this.poolAddress,
        },
      },
    ];
  }

  async removeDept(
    dept: MinimalAsset,
    amount: string,
    walletAddress: Hex
  ): Promise<EncodedTransaction[]> {
    const assetAddress = Asset.onChainAddress(dept, this.chain) as Hex;
    const weiAmount = parseUnits(amount, Asset.decimals(dept, this.chain));
    const interestRateMode = BigInt(1); // Variable interest rate;

    return [
      {
        chain: this.chain,
        transactionType: "LEVERAGE_BORROW",
        transactionLabel: `Borrow ${amount} ${dept.symbol} on Aave`,
        transactionValue: "0",
        payload: encodeFunctionData({
          abi: AAVE_POOL_ABI,
          functionName: "borrow",
          args: [
            assetAddress,
            weiAmount,
            interestRateMode,
            AAVE_REFERRAL_CODE,
            walletAddress,
          ],
        }),
        address: {
          fromAddress: walletAddress,
          toAddress: this.poolAddress,
        },
      },
    ];
  }
}
