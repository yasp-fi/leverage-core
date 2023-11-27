import { TransactionPayload } from "@yasp/models";
import { FlashLoanParams, FlashLoanProvider } from "../flashloan-provider";

export class AaveFlashLoanProvider extends FlashLoanProvider {
  async flashloan(params: FlashLoanParams): Promise<TransactionPayload> {
    return new TransactionPayload({
      setupTransactions: [],
      transactions: [],
      cleanupTransactions: [],
    });
  }
}
