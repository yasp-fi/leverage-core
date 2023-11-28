import { parseAbi } from "viem";

export const AAVE_POOL_ABI = parseAbi([
  `function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external`,
  `function withdraw(address asset, uint256 amount, address to) external returns (uint256)`,
  `function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external`,
  `function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf) external returns (uint256)`,
  `function setUserEMode(uint8 categoryId) external`,
  `function flashLoan(address receiverAddress, address[] calldata assets, uint256[] calldata amounts, uint256[] calldata interestRateModes, address onBehalfOf, bytes calldata params, uint16 referralCode) external`,
]);
