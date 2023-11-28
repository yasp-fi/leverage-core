import { ChainNativeSymbols } from "@yasp/models";

export const MAX_BPS = 10000;
export const AAVE_REFERRAL_CODE = 0;

export const chainToAavePoolMapper: Partial<
  Record<ChainNativeSymbols, `0x${string}`>
> = {
  [ChainNativeSymbols.Ethereum]: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
  [ChainNativeSymbols.Optimism]: "0x794a61358d6845594f94dc1db02a252b5b4814ad",
  [ChainNativeSymbols.Arbitrum]: "0x794a61358d6845594f94dc1db02a252b5b4814ad",
  [ChainNativeSymbols.Avalanche]: "0x794a61358d6845594f94dc1db02a252b5b4814ad",
  [ChainNativeSymbols.Polygon]: "0x794a61358d6845594f94dc1db02a252b5b4814ad",
  [ChainNativeSymbols.Base]: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
};

export const chainToBalancerVaultMapper: Partial<Record<ChainNativeSymbols, `0x${string}`>> = {
  [ChainNativeSymbols.Ethereum]: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
  [ChainNativeSymbols.Optimism]: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
  [ChainNativeSymbols.Arbitrum]: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
  [ChainNativeSymbols.Avalanche]: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
  [ChainNativeSymbols.Polygon]: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
  [ChainNativeSymbols.Base]: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
}