import { ChainNativeSymbols } from "@yasp/models";

export const MAX_BPS = 10000;
export const chainToBalancerVaultMapper: Partial<Record<ChainNativeSymbols, `0x${string}`>> = {
  [ChainNativeSymbols.Ethereum]: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
  [ChainNativeSymbols.Optimism]: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
  [ChainNativeSymbols.Arbitrum]: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
  [ChainNativeSymbols.Avalanche]: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
  [ChainNativeSymbols.Polygon]: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
  [ChainNativeSymbols.Base]: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
}
