import { ChainNativeSymbols, EncodedTransaction, MinimalAsset } from "@yasp/models";
import { Hex, formatUnits, parseUnits } from "viem";
import { MAX_BPS } from "./constants";
import { FlashLoanProvider } from "./flashloan-provider";
import { SwapProvider } from "./swap-provider";

export abstract class LeverageProvider {
  constructor(
    readonly flashloan: FlashLoanProvider,
    readonly swapper: SwapProvider,
    readonly chain: ChainNativeSymbols
  ) {}

  async leverage(
    collateral: MinimalAsset,
    dept: MinimalAsset,
    amount: string,
    leverage: number,
    walletAddress: Hex
  ): Promise<EncodedTransaction[]> {
    const leverageBps = BigInt(Math.round(leverage * MAX_BPS));

    const weiAmount = parseUnits(amount, dept.decimals);
    const leverageWeiAmount = (weiAmount * leverageBps) / BigInt(MAX_BPS);
    const loanedWeiAmount = leverageWeiAmount - weiAmount;

    const leverageAmount = formatUnits(leverageWeiAmount, dept.decimals);
    const loanedAmount = formatUnits(loanedWeiAmount, dept.decimals);

    return Promise.all([
      this.swapper.swap(this.chain, dept, collateral, loanedAmount, loanedAmount),
      this.setup(collateral, dept),
      this.addCollateral(collateral, leverageAmount, walletAddress),
      this.removeDept(dept, loanedAmount, walletAddress),
    ]).then((data) => data.flat());
  }

  async deleverage(
    collateral: MinimalAsset,
    dept: MinimalAsset,
    walletAddress: Hex
  ): Promise<any> {
    const { deptAmount, collateralAmount } =
      await this.positionOf(walletAddress);

    return Promise.all([
      this.addDept(dept, deptAmount, walletAddress),
      this.removeCollateral(collateral, collateralAmount, walletAddress),
      this.swapper.swap(this.chain, collateral, dept, collateralAmount, deptAmount),
    ]).then((data) => data.flat());
  }

  abstract positionOf(walletAddress: Hex): Promise<any>;

  abstract setup(
    collateral: MinimalAsset,
    dept: MinimalAsset
  ): Promise<EncodedTransaction[]>;

  abstract addCollateral(
    collateral: MinimalAsset,
    amount: string,
    walletAddress: Hex
  ): Promise<EncodedTransaction[]>;

  abstract removeCollateral(
    collateral: MinimalAsset,
    amount: string,
    walletAddress: Hex
  ): Promise<EncodedTransaction[]>;

  abstract addDept(
    dept: MinimalAsset,
    amount: string,
    walletAddress: Hex
  ): Promise<EncodedTransaction[]>;

  abstract removeDept(
    dept: MinimalAsset,
    amount: string,
    walletAddress: Hex
  ): Promise<EncodedTransaction[]>;
}
