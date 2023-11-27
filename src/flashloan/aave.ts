import { Asset, ChainNativeSymbols, EncodedTransaction } from "@yasp/models";
import { FlashLoanParams, FlashLoanProvider } from "../flashloan-provider";
import { Hex, encodeFunctionData, parseUnits } from "viem";
import { AAVE_POOL_ABI } from "../abis";
import { chainToAavePoolMapper } from "../constants";

export class AaveFlashLoanProvider extends FlashLoanProvider {
  poolAddress: Hex;

  constructor(chain: ChainNativeSymbols) {
    const pool = chainToAavePoolMapper[chain]!;

    if (!pool) {
      throw new Error(`Aave V3 is not supported on "${chain}" network`);
    }

    super(chain);
    this.poolAddress = pool;
  }

  async flashloan(params: FlashLoanParams): Promise<EncodedTransaction> {
    const tokens = params.assets.map(
      (item) => Asset.onChainAddress(item.asset, this.chain) as Hex
    );
    const amounts = params.assets.map((item) =>
      parseUnits(item.amount, Asset.decimals(item.asset, this.chain))
    );

    const interestRates = new Array(params.assets.length).fill(BigInt(0));

    const innerPayload = "0x0";

    return {
      chain: this.chain,
      transactionType: "FLASH_LOAN",
      transactionLabel: "Flashloan on Aave",
      transactionValue: "0",
      payload: encodeFunctionData({
        abi: AAVE_POOL_ABI,
        functionName: "flashLoan",
        args: [
          params.receiver,
          tokens,
          amounts,
          interestRates,
          innerPayload,
          params.receiver,
          0,
        ],
      }),
      address: {
        fromAddress: params.receiver,
        toAddress: this.poolAddress,
      },
    };
  }
}
