import { parseAbi } from "viem";

export const BALANCER_VAULT_ABI = parseAbi([
  `function flashLoan(address receiverAddress, address[] calldata assets, uint256[] calldata amounts, bytes calldata params) external`,
]);
