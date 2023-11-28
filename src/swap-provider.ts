import {ChainNativeSymbols, EncodedTransaction, MinimalAsset} from "@yasp/models";
import {Hex} from "viem";




export abstract class SwapProvider {


  abstract previewSwap(
    chain: ChainNativeSymbols,
    assetIn: MinimalAsset,
    assetOut: MinimalAsset,
    amountIn: string,
    walletAddress: Hex,
    slippageBPS?: number
  ): Promise<number>;
  
  abstract swap(
    chain: ChainNativeSymbols,
    assetIn: MinimalAsset,
    assetOut: MinimalAsset,
    amountIn: string,
    minAmountOut: string,
    walletAddress: Hex,
    slippageBPS?: number,
  ): Promise<EncodedTransaction[]>;
}
