import { Asset, Chain, ChainNativeSymbols, MinimalAsset } from "@yasp/models";
import { Hex } from "viem";
import {
  ForDEXQuoteParams,
  KyberSwapProvider,
  KyberSwapRoute,
  SingleQuoteResult,
} from "@yasp/swap-providers";

export async function _getKyberSwapQuoteResult(
  this: KyberSwapProvider,
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
  };

  return this.forDEXQuote(chain, dexQuoteParams) as Promise<
    SingleQuoteResult<KyberSwapRoute>
  >;
}
