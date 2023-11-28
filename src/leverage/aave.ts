import {
  Asset,
  EncodedTransaction,
  MinimalAsset,
} from "@yasp/models";
import {
  AavePoolAddressesProvider,
  AavePoolDataProvider,
  AaveUIPoolDataProvider,
  AaveV3Pool,
  formatEvmAddress
} from '@yasp/evm-lib'

import { LeverageProvider } from "../leverage-provider";
import { Hex, parseUnits } from "viem";

export class AaveLeverageProvider extends LeverageProvider {
  uiPoolDataProvider: AaveUIPoolDataProvider | null = null;
  poolDataProvider: AavePoolDataProvider | null = null;
  poolContract: AaveV3Pool | null = null;
  poolAddressesProvider: AavePoolAddressesProvider | null = null

  async _setupAaveContracts(): Promise<{
    uiPoolDataProvider: AaveUIPoolDataProvider;
    poolContract: AaveV3Pool;
    poolDataProvider: AavePoolDataProvider;
    poolAddressesProvider: AavePoolAddressesProvider;
  }> {
    if (!this.uiPoolDataProvider || !this.poolContract || !this.poolDataProvider || !this.poolAddressesProvider) {
      this.poolAddressesProvider = new AavePoolAddressesProvider(this.chain);

      const {
        POOL,
        POOL_DATA_PROVIDER,
      } = await this.poolAddressesProvider.getContracts();

      const uiPoolDataProvider = new AaveUIPoolDataProvider(this.chain);
      const poolDataProvider = new AavePoolDataProvider(this.chain, POOL_DATA_PROVIDER);
      const poolContract = new AaveV3Pool(this.chain, POOL);

      this.uiPoolDataProvider = uiPoolDataProvider
      this.poolDataProvider = poolDataProvider
      this.poolContract = poolContract
    }

    return {
      uiPoolDataProvider: this.uiPoolDataProvider,
      poolContract: this.poolContract,
      poolDataProvider: this.poolDataProvider,
      poolAddressesProvider: this.poolAddressesProvider,
    }
  }

  async positionOf(walletAddress: Hex) {
    const {
      uiPoolDataProvider,
      poolDataProvider,
    } = await this._setupAaveContracts()

    return uiPoolDataProvider.getUserReservesData(
        poolDataProvider.protocolDataProviderAddress,
        walletAddress,
    );
  }

  async setup(
    collateral: MinimalAsset,
    dept: MinimalAsset,
    walletAddress: Hex,
  ): Promise<EncodedTransaction[]> {

    const {
      poolDataProvider,
      uiPoolDataProvider,
      poolContract,
    } = await this._setupAaveContracts();

    const [reserves, currencyInfo] = await uiPoolDataProvider
        .getReservesData(poolDataProvider.protocolDataProviderAddress)

    const deptAddress = formatEvmAddress(Asset.onChainAddress(dept, this.chain));

    const deptReserve = reserves.find(
        reserve => reserve.underlyingAsset === deptAddress
    )


    if (deptReserve) {
      const {
        eModeCategoryId,
      } = deptReserve;

      const {
        encodedPayload: payload,
      } = await poolContract.setUserEMode({
        params: {
          categoryId: eModeCategoryId,
          onBehalfOf: walletAddress,
        },
        prepareTransaction: false,
      })

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
      ]
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
    const {
      poolContract,
    } = await this._setupAaveContracts();

    const {
      encodedPayload: payload,
    } = await poolContract.supplyAllFormats({
      params: {
        asset: assetAddress,
        amount: weiAmount,
        onBehalfOf: walletAddress,
      },
      prepareTransaction: false,
    })


    return [
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

    const {
      poolContract,
    } = await this._setupAaveContracts();

    const {
      encodedPayload: payload,
    } = await poolContract.withdrawAllFormats({
      params: {
        asset: assetAddress,
        amount: weiAmount,
        to: walletAddress,
      },
      prepareTransaction: false,
    })

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
    const interestRateMode = BigInt(1); // Variable interest rate;
    const {
      poolContract,
    } = await this._setupAaveContracts();

    const {
      encodedPayload: payload,
    } = await poolContract.repayAllFormats({
      params: {
        asset: assetAddress,
        amount: weiAmount,
        interestRateMode: interestRateMode,
        onBehalfOf: walletAddress,
      },
      prepareTransaction: false,
    })

    return [
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
    const interestRateMode = BigInt(1);
    const {
      poolContract,
    } = await this._setupAaveContracts();

    const {
      encodedPayload: payload,
    } = await poolContract.borrowAllFormats({
      params: {
        asset: assetAddress,
        amount: weiAmount,
        interestRateMode: interestRateMode,
        onBehalfOf: walletAddress,
      },
      prepareTransaction: false,
    })

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
