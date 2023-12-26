import { createSafeWretch } from "@yasp/requests";

export type DefiLlamaApyInfo = {
  timestamp: string;
  tvlUsd: number;
  apy: number;
  apyBase: number | null;
  apyReward: number | null;
  il7d: number | null;
  apyBase7d: number | null;
};

export type YieldInfo = {
  symbol: string;
  apy: number;
};

const median = (numbers: number[]): number => {
  const sorted = Array.from(numbers).sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
};

export class YieldHelper {
  cachedAPY: Record<string, number> = {};

  updateInterval: number = 15000;
  updatedAt = 0;

  get shouldUpdate() {
    const date = Date.now();
    return (
      !this.updatedAt ||
      Math.abs(this.updatedAt - date) > this.updateInterval ||
      Object.entries(this.cachedAPY).length === 0
    );
  }

  async getAPY(symbol: string) {
    if (this.shouldUpdate) {
      await this.#updateAPY();
    }
    return this.cachedAPY[symbol] || 0;
  }

  async #updateAPY() {
    const infos = await Promise.all([
      this.#getLidoAPY(),
      // this.#getRocketPoolAPY(),
      // this.#getSavingDaiAPY(),
    ]);

    const entries = infos.flat().map((i) => [i.symbol, i.apy]);
    this.cachedAPY = Object.fromEntries(entries);
    this.updatedAt = Date.now();
  }

  async #getDefiLlamaPoolApy(llamaPool: string): Promise<number> {
    const { data = [] } = await createSafeWretch(
      `https://yields.llama.fi/chart/${llamaPool}`
    )
      .get()
      .json<{ data: DefiLlamaApyInfo[] }>();

    return median(data.map((i) => i.apyBase || i.apy));
  }

  async #getLidoAPY(): Promise<YieldInfo[]> {
    const apy = await this.#getDefiLlamaPoolApy("747c1d2a-c668-4682-b9f9-296708a3dd90");

    return [
      { symbol: "stETH", apy },
      { symbol: "wstETH", apy },
      { symbol: "WSTETH", apy },
      { symbol: "STETH", apy },
    ];
  }

  async #getRocketPoolAPY(): Promise<YieldInfo[]> {
    const apy = await this.#getDefiLlamaPoolApy("d4b3c522-6127-4b89-bedf-83641cdcd2eb");

    return [
      { symbol: "rETH", apy },
      { symbol: "RETH", apy },
    ];
  }

  async #getSavingDaiAPY(): Promise<YieldInfo[]> {
    const apy = await this.#getDefiLlamaPoolApy("13392973-be6e-4b2f-bce9-4f7dd53d1c3a");

    return [
      { symbol: "sDAI", apy },
      { symbol: "SDAI", apy },
    ];
  }
}
