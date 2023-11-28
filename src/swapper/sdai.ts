import {ChainNativeSymbols, EncodedTransaction, MinimalAsset, TransactionPayload} from "@yasp/models";
import { SwapProvider } from "../swap-provider";
import {KyberSwapProvider} from "@yasp/swap-providers";
import {Hex} from "viem";
import {_getKyberSwapQuoteResult} from "./utils/get-ks-quote";

export class SDaiSwapper extends SwapProvider {
  constructor(
      public kyberSwapSwapProvider: KyberSwapProvider,
  ) {
    super();
  }


  async _getQuote(
      chain: ChainNativeSymbols,
      assetIn: MinimalAsset,
      assetOut: MinimalAsset,
      amountIn: string,
      walletAddress: Hex,
      slippageBPS?: number
  ) {
    return _getKyberSwapQuoteResult.bind(this.kyberSwapSwapProvider)(
        chain,
        assetIn,
        assetOut,
        amountIn,
        walletAddress,
        slippageBPS,
    )
  }

  async previewSwap(
      chain: ChainNativeSymbols,
      assetIn: MinimalAsset,
      assetOut: MinimalAsset,
      amountIn: string,
      walletAddress: Hex,
      slippageBPS?: number
  ): Promise<number> {
    const quote = await this._getQuote(
        chain,
        assetIn,
        assetOut,
        amountIn,
        walletAddress,
        slippageBPS,
    )
    return +quote.dexQuote.toAssetAmount;
  }

  async swap(
      chain: ChainNativeSymbols,
      assetIn: MinimalAsset,
      assetOut: MinimalAsset,
      amountIn: string,
      minAmountOut: string,
      walletAddress: Hex,
      slippageBPS?: number
  ): Promise<EncodedTransaction[]> {
    const quote = await this._getQuote(
        chain,
        assetIn,
        assetOut,
        amountIn,
        walletAddress,
        slippageBPS,
    )


    if (+minAmountOut > +quote.providerQuote.data.routeSummary.amountOut) {
      throw new Error()
    }

    const swapTxPayload = await this.kyberSwapSwapProvider.createTransactionPayload(chain, quote, walletAddress)

    return TransactionPayload.asArray(swapTxPayload)
  }
}
