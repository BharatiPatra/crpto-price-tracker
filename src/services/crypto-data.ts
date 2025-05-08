/**
 * Represents the data structure for a cryptocurrency.
 */
export interface CryptoAsset {
  id: string;
  name: string;
  symbol: string;
  logo: string;
  price: number;
  percentChange1h: number;
  percentChange24h: number;
  percentChange7d: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  maxSupply: number | null;
  sparkline7d: number[];
}

const BINANCE_API_BASE_URL = 'https://api.binance.com/api/v3';

const baseAssets: Omit<CryptoAsset, 'price' | 'percentChange1h' | 'percentChange24h' | 'percentChange7d' | 'marketCap' | 'volume24h' | 'sparkline7d'>[] = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    logo: 'https://picsum.photos/seed/btc/24/24',
    circulatingSupply: 19700000,
    maxSupply: 21000000,
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    logo: 'https://picsum.photos/seed/eth/24/24',
    circulatingSupply: 120000000,
    maxSupply: null,
  },
  {
    id: 'tether',
    name: 'Tether',
    symbol: 'USDT',
    logo: 'https://picsum.photos/seed/usdt/24/24',
    circulatingSupply: 110000000000,
    maxSupply: null,
  },
  {
    id: 'binancecoin',
    name: 'BNB',
    symbol: 'BNB',
    logo: 'https://picsum.photos/seed/bnb/24/24',
    circulatingSupply: 153000000,
    maxSupply: 200000000,
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    logo: 'https://picsum.photos/seed/sol/24/24',
    circulatingSupply: 460000000,
    maxSupply: null,
  },
];

interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
}

type BinanceKline = [number, string, string, string, string, string, number, string, number, string, string, string];

async function fetchTickerData(symbol: string): Promise<BinanceTicker | null> {
  try {
    const response = await fetch(`${BINANCE_API_BASE_URL}/ticker/24hr?symbol=${symbol.toUpperCase()}USDT`);
    if (!response.ok) {
      console.error(`Failed to fetch ticker for ${symbol}: ${response.statusText}`);
      return null;
    }
    const data = await response.json();
    return {
      symbol: data.symbol,
      lastPrice: data.lastPrice,
      priceChangePercent: data.priceChangePercent,
      quoteVolume: data.quoteVolume,
    };
  } catch (error) {
    console.error(`Error fetching ticker for ${symbol}:`, error);
    return null;
  }
}

async function fetchKlineData(symbol: string, interval: string, limit: number): Promise<BinanceKline[] | null> {
  try {
    const response = await fetch(`${BINANCE_API_BASE_URL}/klines?symbol=${symbol.toUpperCase()}USDT&interval=${interval}&limit=${limit}`);
    if (!response.ok) {
      console.error(`Failed to fetch klines for ${symbol}: ${response.statusText}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching klines for ${symbol}:`, error);
    return null;
  }
}

async function getCryptoAssetWithLiveData(
  baseAsset: Omit<CryptoAsset, 'price' | 'percentChange1h' | 'percentChange24h' | 'percentChange7d' | 'marketCap' | 'volume24h' | 'sparkline7d'>
): Promise<CryptoAsset | null> {
  if (baseAsset.symbol === 'USDT') {
    const price = 1.0;
    const approxVolume = baseAsset.circulatingSupply / 2;
    return {
      ...baseAsset,
      price,
      percentChange1h: 0.0,
      percentChange24h: 0.0,
      percentChange7d: 0.0,
      marketCap: baseAsset.circulatingSupply * price,
      volume24h: approxVolume,
      sparkline7d: Array(7).fill(price),
    };
  }

  const tickerData = await fetchTickerData(baseAsset.symbol);
  const dailyKlines = await fetchKlineData(baseAsset.symbol, '1d', 8);
  const hourlyKlines = await fetchKlineData(baseAsset.symbol, '1h', 2);

  if (!tickerData) {
    return {
      ...baseAsset,
      price: 0,
      percentChange1h: 0,
      percentChange24h: 0,
      percentChange7d: 0,
      marketCap: 0,
      volume24h: 0,
      sparkline7d: Array(7).fill(0),
    };
  }

  const currentPrice = parseFloat(tickerData.lastPrice);
  const percentChange24h = parseFloat(tickerData.priceChangePercent);
  const volume24h = parseFloat(tickerData.quoteVolume);
  const marketCap = currentPrice * baseAsset.circulatingSupply;

  let percentChange1h = 0;
  if (hourlyKlines && hourlyKlines.length >= 2) {
    const price1HourAgo = parseFloat(hourlyKlines[0][4]);
    if (price1HourAgo !== 0) {
      percentChange1h = ((currentPrice - price1HourAgo) / price1HourAgo) * 100;
    }
  }

  let percentChange7d = 0;
  let sparkline7d: number[] = Array(7).fill(currentPrice);

  if (dailyKlines && dailyKlines.length >= 8) {
    sparkline7d = dailyKlines.slice(1).map(kline => parseFloat(kline[4]));
    const price7DaysAgo = parseFloat(dailyKlines[0][4]);
    if (price7DaysAgo !== 0) {
      percentChange7d = ((currentPrice - price7DaysAgo) / price7DaysAgo) * 100;
    }
  } else if (dailyKlines && dailyKlines.length > 0) {
    sparkline7d = dailyKlines.slice(Math.max(0, dailyKlines.length - 7)).map(kline => parseFloat(kline[4]));
    while (sparkline7d.length < 7) sparkline7d.unshift(sparkline7d[0] || currentPrice);
  }

  return {
    ...baseAsset,
    price: currentPrice,
    percentChange1h: parseFloat(percentChange1h.toFixed(2)),
    percentChange24h: parseFloat(percentChange24h.toFixed(2)),
    percentChange7d: parseFloat(percentChange7d.toFixed(2)),
    marketCap,
    volume24h,
    sparkline7d,
  };
}

/**
 * Asynchronously retrieves crypto asset data by fetching live data from Binance.
 */
export async function getCryptoAssets(): Promise<CryptoAsset[]> {
  const assetPromises = baseAssets.map(asset => getCryptoAssetWithLiveData(asset));
  const resolvedAssets = await Promise.all(assetPromises);
  return resolvedAssets.filter((asset): asset is CryptoAsset => asset !== null);
}
