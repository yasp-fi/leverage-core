import {Asset, Chain, ChainNativeSymbols, EncodedTransaction, MinimalAsset, TransactionPayload} from "@yasp/models";
import {
  ForDEXQuoteParams,
  KyberSwapProvider,
} from '@yasp/swap-providers'
import { SwapProvider } from "../swap-provider";
import {Hex} from "viem";

export class LidoSwapper extends SwapProvider {
  constructor(
      public kyberSwapSwapProvider: KyberSwapProvider,
  ) {
    super();
  }


  async _getKyberSwapQuoteResult(
      chain: ChainNativeSymbols,
      assetIn: MinimalAsset,
      assetOut: MinimalAsset,
      amountIn: string,
      walletAddress: Hex,
      slippageBPS?: number
  ) {
    const dexQuoteParams: ForDEXQuoteParams = {
      fromAsset: {
        decimals: assetIn.decimals,
        symbol: assetIn.symbol,
        isNative: assetIn.isBaseAsset,
        onChainAddress: Asset.onChainAddress(assetIn, chain),
        chainId: Chain.mapNativeSymbolToId(chain),
        chain,
      },
      fromAssetAmount: amountIn,
      toAsset: {
        decimals: assetOut.decimals,
        symbol: assetOut.symbol,
        isNative: assetOut.isBaseAsset,
        onChainAddress: Asset.onChainAddress(assetOut, chain),
        chainId: Chain.mapNativeSymbolToId(chain),
        chain,
      },
      slippage: slippageBPS ?? null,
      walletAddress,
    }

    return this.kyberSwapSwapProvider.forDEXQuote(chain, dexQuoteParams)
  }

  async previewSwap(
    chain: ChainNativeSymbols,
    assetIn: MinimalAsset,
    assetOut: MinimalAsset,
    amountIn: string,
    walletAddress: Hex,
    slippageBPS?: number
  ): Promise<number> {
    const quote = await this._getKyberSwapQuoteResult(
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
    const quote = await this._getKyberSwapQuoteResult(
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
