import { Asset, ChainNativeSymbols, EncodedTransaction } from "@yasp/models";
import { Hex, parseUnits } from "viem";
import { AavePoolAddressesProvider, AaveV3Pool } from "@yasp/evm-lib";

import { FlashLoanParams, FlashLoanProvider } from "../flashloan-provider";

export class AaveFlashLoanProvider extends FlashLoanProvider {
  poolAddressesProvider: AavePoolAddressesProvider;
  constructor(chain: ChainNativeSymbols) {
    super(chain);
    this.poolAddressesProvider = new AavePoolAddressesProvider(this.chain);
  }

  async flashloan(params: FlashLoanParams): Promise<EncodedTransaction> {
    const {
      POOL,
    } = await this.poolAddressesProvider.getContracts()
    const poolContract = new AaveV3Pool(this.chain, POOL);

    const tokens = params.assets.map(
      (item) => Asset.onChainAddress(item.asset, this.chain) as Hex
    );
    const amounts = params.assets.map((item) =>
      parseUnits(item.amount, Asset.decimals(item.asset, this.chain))
    );

    const interestRates = new Array(params.assets.length).fill(BigInt(0));

    const {
      encodedPayload: payload,
    } = await poolContract.flashloanAllFormats({
      params: {
        receiverAddress: params.receiver,
        assets: tokens,
        modes: interestRates,
        onBehalfOf: params.receiver,
        params: params.payload,
        amounts,
      },
      prepareTransaction: false,
    })

    return {
      chain: this.chain,
      transactionType: "FLASH_LOAN",
      transactionLabel: "Flashloan on Aave",
      transactionValue: "0",
      payload,
      address: {
        fromAddress: params.receiver,
        toAddress: poolContract.poolAddress,
      },
    };
  }
}
