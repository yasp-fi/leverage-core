import {
  Asset,
  ChainNativeSymbols,
  EncodedTransaction,
  MinimalAsset,
} from "@yasp/models";
import { ReserveInfo } from "../types";
import { Hex, encodeFunctionData, parseAbi, parseUnits } from "viem";

export const divBigInt = (
  a: bigint,
  b: bigint | number | string,
  precision: number = 6
): number => {
  if (a === BigInt(0)) {
    return 0;
  }
  const ray = 10 ** precision;
  const fracRay = (a * BigInt(ray)) / BigInt(b);
  return Number(fracRay) / ray;
};

export const formatLeverageQuote = (
  collateralPool: ReserveInfo,
  deptPool: ReserveInfo,
  amount: string,
  leverage: number,
  slippage = 0.005
) => {
  const minLeverage = 1;
  const maxLeverage = 1 / (1 - collateralPool.ltv / 100) - 0.01;

  const positiveApy = collateralPool.supplyApy + collateralPool.assetApy;
  const negativeApy =
    (deptPool.borrowApy + deptPool.assetApy) * (collateralPool.ltv / 100);

  const netApy = positiveApy - negativeApy;
  const apy = netApy * leverage;

  const collateralPrice = collateralPool.assetPrice / deptPool.assetPrice;

  const deptAmount = Number(amount) * (leverage - 1);
  const collateralAmount =
    ((Number(amount) * leverage) / collateralPrice) * (1 - slippage);

  const deptAmountUsd = deptAmount * deptPool.assetPrice;
  const collateralAmountUsd = collateralAmount * collateralPool.assetPrice;

  const ltv = (deptAmountUsd / collateralAmountUsd) * 100;

  const liquidationThreshold = collateralPool.liquidationThreshold / 100;
  const liquidationPrice =
    deptAmount / (liquidationThreshold * collateralAmount);

  return {
    netApy,
    minLeverage,
    maxLeverage,

    ltv,
    apy,
    deptAmount,
    deptAmountUsd,
    collateralAmount,
    collateralAmountUsd,

    collateralPrice,
    liquidationPrice,
  };
};

export const setCallback = (
  executor: string,
  callbackId: number,
  chain: ChainNativeSymbols
): EncodedTransaction => {
  const payload = encodeFunctionData({
    abi: parseAbi([`function setCallback(uint8 callbackId) public`]),
    functionName: `setCallback`,
    args: [callbackId],
  });
  return {
    chain,
    transactionType: "FLASH_LOAN",
    transactionLabel: "set callback",
    transactionValue: "0",
    payload,
    address: {
      fromAddress: executor,
      toAddress: executor,
    },
  };
};

export const approve = (
  token: MinimalAsset,
  to: Hex,
  amount: string,
  chain: ChainNativeSymbols
): EncodedTransaction => {
  const tokenAddress = Asset.onChainAddress(token, chain);
  const weiAmount = parseUnits(amount, Asset.decimals(token, chain));

  const payload = encodeFunctionData({
    abi: parseAbi([`function approve(address, uint256) public`]),
    functionName: `approve`,
    args: [to, weiAmount],
  });

  return {
    chain,
    transactionType: "APPROVE",
    transactionLabel: "approve",
    transactionValue: "0",
    payload,
    address: {
      fromAddress: tokenAddress,
      toAddress: tokenAddress,
    },
  };
};
