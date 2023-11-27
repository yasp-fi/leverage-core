import { Asset, ChainNativeSymbols, EncodedTransaction } from "@yasp/models";
import { FlashLoanParams, FlashLoanProvider } from "../flashloan-provider";
import { Hex, encodeFunctionData, parseUnits } from "viem";
import { BALANCER_VAULT_ABI } from "../abis";
import { chainToBalancerVaultMapper } from "../constants";

export class BalancerFlashLoanProvider extends FlashLoanProvider {
  poolAddress: Hex;

  constructor(chain: ChainNativeSymbols) {
    const pool = chainToBalancerVaultMapper[chain]!;

    if (!pool) {
      throw new Error(`Balancer is not supported on "${chain}" network`);
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

    const innerPayload = "0x0";

    return {
      chain: this.chain,
      transactionType: "FLASH_LOAN",
      transactionLabel: "Flashloan on Balancer",
      transactionValue: "0",
      payload: encodeFunctionData({
        abi: BALANCER_VAULT_ABI,
        functionName: "flashLoan",
        args: [params.receiver, tokens, amounts, innerPayload],
      }),
      address: {
        fromAddress: params.receiver,
        toAddress: this.poolAddress,
      },
    };
  }
}
