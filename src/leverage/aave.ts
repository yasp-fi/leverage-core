import {
  Asset,
  EncodedTransaction,
  MinimalAsset,
  ProviderSlug,
} from "@yasp/models";
import {
  AavePoolAddressesProvider,
  AavePoolDataProvider,
  AaveUIPoolDataProvider,
  AaveV3Pool,
  formatEvmAddress,
} from "@yasp/evm-lib";

import { LeverageProvider } from "../leverage-provider";
import { Hex, formatUnits, parseUnits } from "viem";
import { divBigInt, formatLeverageQuote, approve } from "../utils";
import { LeverageInfo, ReserveInfo } from "../types";

export class AaveLeverageProvider extends LeverageProvider {
  providerSlug = "aave-v3" as ProviderSlug;

  uiPoolDataProvider: AaveUIPoolDataProvider | null = null;
  poolDataProvider: AavePoolDataProvider | null = null;
  poolContract: AaveV3Pool | null = null;
  poolAddressesProvider: AavePoolAddressesProvider | null = null;

  async _setupAaveContracts(): Promise<{
    uiPoolDataProvider: AaveUIPoolDataProvider;
    poolContract: AaveV3Pool;
    poolDataProvider: AavePoolDataProvider;
    poolAddressesProvider: AavePoolAddressesProvider;
  }> {
    if (
      !this.uiPoolDataProvider ||
      !this.poolContract ||
      !this.poolDataProvider ||
      !this.poolAddressesProvider
    ) {
      this.poolAddressesProvider = new AavePoolAddressesProvider(this.chain);

      const { POOL, POOL_DATA_PROVIDER } =
        await this.poolAddressesProvider.getContracts();

      const uiPoolDataProvider = new AaveUIPoolDataProvider(this.chain);
      const poolDataProvider = new AavePoolDataProvider(
        this.chain,
        POOL_DATA_PROVIDER
      );
      const poolContract = new AaveV3Pool(this.chain, POOL);

      this.uiPoolDataProvider = uiPoolDataProvider;
      this.poolDataProvider = poolDataProvider;
      this.poolContract = poolContract;
    }

    return {
      uiPoolDataProvider: this.uiPoolDataProvider,
      poolContract: this.poolContract,
      poolDataProvider: this.poolDataProvider,
      poolAddressesProvider: this.poolAddressesProvider,
    };
  }

  formatPool(
    asset: MinimalAsset,
    reserve: any,
    currencyInfo: any,
    assetApy = 0
  ): ReserveInfo {
    return {
      asset,
      ltv: Number(reserve.eModeLtv) / 100,
      liquidationThreshold: Number(reserve.eModeLiquidationThreshold) / 100,
      borrowApy: divBigInt(reserve.variableBorrowRate, 1e27) * 100,
      supplyApy: divBigInt(reserve.liquidityRate, 1e27) * 100,
      reserveSize: divBigInt(
        reserve.availableLiquidity,
        BigInt(10) ** reserve.decimals
      ).toString(),
      assetPrice: divBigInt(
        reserve.priceInMarketReferenceCurrency,
        currencyInfo.marketReferenceCurrencyUnit
      ),
      assetApy,
    };
  }

  async getPositionInfo(
    collateral: MinimalAsset,
    dept: MinimalAsset,
    walletAddress: Hex
  ) {
    const { uiPoolDataProvider, poolDataProvider } =
      await this._setupAaveContracts();

    const {
      collateral: collateralPool,
      dept: deptPool,
      collateralPrice: currentPrice,
      liquidationPrice,
      ltv,
    } = await this.getLeverageInfo(collateral, dept, "1", 1);

    const [userReserves] = await uiPoolDataProvider.getUserReservesData(
      this.poolAddressesProvider!.providerAddress,
      walletAddress
    );

    const { scaledVariableDebt } = userReserves.find(
      (reserve) =>
        reserve.underlyingAsset.toLowerCase() ===
        Asset.onChainAddress(deptPool.asset, this.chain).toLowerCase()
    ) || { scaledVariableDebt: BigInt(0) };

    const { scaledATokenBalance } = userReserves.find(
      (reserve) =>
        reserve.underlyingAsset.toLowerCase() ===
        Asset.onChainAddress(collateralPool.asset, this.chain).toLowerCase()
    ) || { scaledATokenBalance: BigInt(0) };

    return {
      collateral: collateralPool,
      dept: deptPool,

      ltv,
      liquidationPrice,
      currentPrice,

      deptAmount: formatUnits(
        scaledVariableDebt,
        Asset.decimals(dept, this.chain)
      ),
      collateralAmount: formatUnits(
        scaledATokenBalance,
        Asset.decimals(collateral, this.chain)
      ),
    };
  }

  async getLeverageInfo(
    collateral: MinimalAsset,
    dept: MinimalAsset,
    amount: string,
    leverage: number
  ): Promise<LeverageInfo> {
    const { uiPoolDataProvider } = await this._setupAaveContracts();

    const [reserves, currencyInfo] = await uiPoolDataProvider.getReservesData(
      this.poolAddressesProvider!.providerAddress
    );

    const collateralReserve = reserves.find((r) => {
      return (
        r.underlyingAsset.toLowerCase() ===
        Asset.onChainAddress(collateral, this.chain).toLowerCase()
      );
    });

    const deptReserve = reserves.find((r) => {
      return (
        r.underlyingAsset.toLowerCase() ===
        Asset.onChainAddress(dept, this.chain).toLowerCase()
      );
    });

    if (!collateralReserve || !deptReserve) {
      throw new Error(`unable to find reserves`);
    }

    if (!collateralReserve.usageAsCollateralEnabled) {
      throw new Error(`unable to use ${collateral.symbol} as collateral`);
    }

    const collateralPool = this.formatPool(
      collateral,
      collateralReserve,
      currencyInfo,
      3.6 // TODO: add Staking APY
    );

    const deptPool = this.formatPool(dept, deptReserve, currencyInfo);
    const quote = formatLeverageQuote(
      collateralPool,
      deptPool,
      amount,
      leverage
    );

    return {
      collateral: collateralPool,
      dept: deptPool,
      ...quote,
    };
  }

  async setup(
    collateral: MinimalAsset,
    dept: MinimalAsset,
    walletAddress: Hex
  ): Promise<EncodedTransaction[]> {
    const { uiPoolDataProvider, poolContract } =
      await this._setupAaveContracts();

    const [reserves] = await uiPoolDataProvider.getReservesData(
      this.poolAddressesProvider!.providerAddress
    );

    const deptAddress = formatEvmAddress(
      Asset.onChainAddress(dept, this.chain)
    );

    const deptReserve = reserves.find(
      (reserve) => reserve.underlyingAsset === deptAddress
    );

    if (deptReserve) {
      const { eModeCategoryId } = deptReserve;

      const { encodedPayload: payload } = await poolContract.setUserEMode({
        params: {
          categoryId: eModeCategoryId,
          onBehalfOf: walletAddress,
        },
        prepareTransaction: false,
      });

      return [
        {
          chain: this.chain,
          transactionType: "LEVERAGE_SETUP",
          transactionLabel: `Set eMode to ${eModeCategoryId} on Aave`,
          transactionValue: "0",
          payload,
          address: {
            fromAddress: walletAddress,
            toAddress: poolContract.poolAddress,
          },
        },
      ];
    }

    return [];
  }

  async addCollateral(
    collateral: MinimalAsset,
    amount: string,
    walletAddress: Hex
  ): Promise<EncodedTransaction[]> {
    const assetAddress = Asset.onChainAddress(collateral, this.chain) as Hex;
    const weiAmount = parseUnits(
      amount,
      Asset.decimals(collateral, this.chain)
    );
    const { poolContract } = await this._setupAaveContracts();

    const { encodedPayload: payload } = await poolContract.supplyAllFormats({
      params: {
        asset: assetAddress,
        amount: weiAmount,
        onBehalfOf: walletAddress,
      },
      prepareTransaction: false,
    });

    return [
      approve(collateral, poolContract.poolAddress, amount, this.chain),
      {
        chain: this.chain,
        transactionType: "LEVERAGE_SUPPLY",
        transactionLabel: `Supply ${amount} ${collateral.symbol} on Aave`,
        transactionValue: "0",
        payload,
        address: {
          fromAddress: walletAddress,
          toAddress: poolContract.poolAddress,
        },
      },
    ];
  }

  async removeCollateral(
    collateral: MinimalAsset,
    amount: string,
    walletAddress: Hex
  ): Promise<EncodedTransaction[]> {
    const assetAddress = Asset.onChainAddress(collateral, this.chain) as Hex;
    const weiAmount = parseUnits(
      amount,
      Asset.decimals(collateral, this.chain)
    );

    const { poolContract } = await this._setupAaveContracts();

    const { encodedPayload: payload } = await poolContract.withdrawAllFormats({
      params: {
        asset: assetAddress,
        amount: weiAmount,
        to: walletAddress,
      },
      prepareTransaction: false,
    });

    return [
      {
        chain: this.chain,
        transactionType: "LEVERAGE_WITHDRAW",
        transactionLabel: `Withdraw ${amount} ${collateral.symbol} on Aave`,
        transactionValue: "0",
        payload,
        address: {
          fromAddress: walletAddress,
          toAddress: poolContract.poolAddress,
        },
      },
    ];
  }

  async addDept(
    dept: MinimalAsset,
    amount: string,
    walletAddress: Hex
  ): Promise<EncodedTransaction[]> {
    const assetAddress = Asset.onChainAddress(dept, this.chain) as Hex;
    const weiAmount = parseUnits(amount, Asset.decimals(dept, this.chain));
    const interestRateMode = BigInt(2); // Variable interest rate;
    const { poolContract } = await this._setupAaveContracts();

    const { encodedPayload: payload } = await poolContract.repayAllFormats({
      params: {
        asset: assetAddress,
        amount: weiAmount,
        interestRateMode: interestRateMode,
        onBehalfOf: walletAddress,
      },
      prepareTransaction: false,
    });

    return [
      approve(dept, poolContract.poolAddress, amount, this.chain),
      {
        chain: this.chain,
        transactionType: "LEVERAGE_REPAY",
        transactionLabel: `Repay ${amount} ${dept.symbol} on Aave`,
        transactionValue: "0",
        payload,
        address: {
          fromAddress: walletAddress,
          toAddress: poolContract.poolAddress,
        },
      },
    ];
  }

  async removeDept(
    dept: MinimalAsset,
    amount: string,
    walletAddress: Hex
  ): Promise<EncodedTransaction[]> {
    const assetAddress = Asset.onChainAddress(dept, this.chain) as Hex;
    const weiAmount = parseUnits(amount, Asset.decimals(dept, this.chain));
    const interestRateMode = BigInt(2);
    const { poolContract } = await this._setupAaveContracts();

    const { encodedPayload: payload } = await poolContract.borrowAllFormats({
      params: {
        asset: assetAddress,
        amount: weiAmount,
        interestRateMode: interestRateMode,
        onBehalfOf: walletAddress,
      },
      prepareTransaction: false,
    });

    return [
      {
        chain: this.chain,
        transactionType: "LEVERAGE_BORROW",
        transactionLabel: `Borrow ${amount} ${dept.symbol} on Aave`,
        transactionValue: "0",
        payload,
        address: {
          fromAddress: walletAddress,
          toAddress: poolContract.poolAddress,
        },
      },
    ];
  }
}
