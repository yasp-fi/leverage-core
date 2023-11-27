import { EncodedTransaction, MinimalAsset } from "@yasp/models";
import { SwapProvider } from "../swap-provider";

export class LidoSwapper extends SwapProvider {
  async previewSwap(
    assetIn: MinimalAsset,
    assetOut: MinimalAsset,
    amountIn: string,
    slippageBPS?: number
  ): Promise<number> {
    return Number(amountIn);
  }

  async swap(
    assetIn: MinimalAsset,
    assetOut: MinimalAsset,
    amountIn: string,
    minAmountOut: string,
    slippageBPS?: number
  ): Promise<EncodedTransaction[]> {
    return [];
  }
}
