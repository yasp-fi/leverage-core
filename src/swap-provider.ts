import { EncodedTransaction, MinimalAsset } from "@yasp/models";

export abstract class SwapProvider {
  abstract previewSwap(
    assetIn: MinimalAsset,
    assetOut: MinimalAsset,
    amountIn: string,
    slippageBPS?: number
  ): Promise<number>;
  
  abstract swap(
    assetIn: MinimalAsset,
    assetOut: MinimalAsset,
    amountIn: string,
    minAmountOut: string,
    slippageBPS?: number
  ): Promise<EncodedTransaction[]>;
}
