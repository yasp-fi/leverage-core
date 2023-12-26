import {
  ChainNativeSymbols,
  EncodedTransaction,
  MinimalAsset,
  ProviderSlug,
} from "@yasp/models";
import { Hex, formatUnits, parseUnits } from "viem";
import { MAX_BPS } from "./constants";
import { SwapProvider } from "./swap-provider";
import { LeverageInfo, UserPosition } from "./types";

export abstract class LeverageProvider {
  abstract providerSlug: ProviderSlug;

  constructor(
    public readonly chain: ChainNativeSymbols,
    readonly swapper: SwapProvider
  ) {}

  async leverage(
    collateral: MinimalAsset,
    dept: MinimalAsset,
    amount: string,
    leverage: number,
    walletAddress: Hex
  ): Promise<EncodedTransaction[]> {
    const { collateralPrice } = await this.getLeverageInfo(
      collateral,
      dept,
      amount,
      leverage
    );

    const leverageBps = BigInt(Math.round(leverage * MAX_BPS));
    const priceBps = BigInt(Math.round(collateralPrice * MAX_BPS));

    const weiAmount = parseUnits(amount, dept.decimals);
    const leverageWeiAmount = (weiAmount * leverageBps) / BigInt(MAX_BPS);
    const collateralWeiAmount =
      (leverageWeiAmount / BigInt(priceBps)) * BigInt(MAX_BPS);
    const deptWeiAmount = leverageWeiAmount - weiAmount;

    const leverageAmount = formatUnits(leverageWeiAmount, dept.decimals);
    const collateralAmount = formatUnits(
      collateralWeiAmount,
      collateral.decimals
    );
    const deptAmount = formatUnits(deptWeiAmount, dept.decimals);

    return Promise.all([
      this.swapper.swap(
        this.chain,
        dept,
        collateral,
        leverageAmount,
        collateralAmount,
        walletAddress
      ),
      this.setup(collateral, dept, walletAddress),
      this.addCollateral(collateral, collateralAmount, walletAddress),
      this.removeDept(dept, deptAmount, walletAddress),
    ]).then((data) => data.flat());
  }

  async deleverage(
    collateral: MinimalAsset,
    dept: MinimalAsset,
    walletAddress: Hex
  ): Promise<any> {
    const { deptAmount, collateralAmount } = await this.getPositionInfo(
      collateral,
      dept,
      walletAddress
    );

    return Promise.all([
      this.addDept(dept, deptAmount, walletAddress),
      this.removeCollateral(collateral, collateralAmount, walletAddress),
      this.swapper.swap(
        this.chain,
        collateral,
        dept,
        collateralAmount,
        deptAmount,
        walletAddress
      ),
    ]).then((data) => data.flat());
  }

  abstract getPositionInfo(
    collateral: MinimalAsset,
    dept: MinimalAsset,
    walletAddress: Hex
  ): Promise<UserPosition>;

  abstract getLeverageInfo(
    collateral: MinimalAsset,
    dept: MinimalAsset,
    amount: string,
    leverage: number
  ): Promise<LeverageInfo>;

  abstract setup(
    collateral: MinimalAsset,
    dept: MinimalAsset,
    walletAddress: Hex
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
