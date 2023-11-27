import { ChainNativeSymbols, EncodedTransaction, MinimalAsset } from "@yasp/models";

export abstract class SwapProvider {
  abstract previewSwap(
    chain: ChainNativeSymbols,
    assetIn: MinimalAsset,
    assetOut: MinimalAsset,
    amountIn: string,
    slippageBPS?: number
  ): Promise<number>;

  abstract swap(
    chain: ChainNativeSymbols,
    assetIn: MinimalAsset,
    assetOut: MinimalAsset,
    amountIn: string,
    minAmountOut: string,
    slippageBPS?: number
  ): Promise<EncodedTransaction[]>;
}
