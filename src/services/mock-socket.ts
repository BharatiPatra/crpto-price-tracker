
import type { AppDispatch } from '../store';
import { updateAsset, type AssetUpdatePayload } from '@/store/crypto-slice';
import type { CryptoAsset } from './crypto-data';

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/stream';

interface BinanceTickerData {
  e: string; // Event type (e.g., "24hrTicker")
  E: number; // Event time
  s: string; // Symbol (e.g., "BTCUSDT")
  p: string; // Price change
  P: string; // Price change percent
  w: string; // Weighted average price
  x: string; // First trade(F)-1 price (first trade before 24hr window)
  c: string; // Last price
  Q: string; // Last quantity
  b: string; // Best bid price
  B: string; // Best bid quantity
  a: string; // Best ask price
  A: string; // Best ask quantity
  o: string; // Open price
  h: string; // High price
  l: string; // Low price
  v: string; // Total traded base asset volume
  q: string; // Total traded quote asset volume
  O: number; // Statistics open time
  C: number; // Statistics close time
  F: number; // First trade ID
  L: number; // Last trade ID
  n: number; // Total number of trades
}

interface BinanceCombinedStreamMessage {
  stream: string; // e.g., "btcusdt@ticker"
  data: BinanceTickerData;
}

export class BinanceWebSocketService {
  private ws: WebSocket | null = null;
  private dispatch: AppDispatch;
  private initialAssets: CryptoAsset[] = [];
  private symbolToIdMap: Map<string, string> = new Map(); // Maps "BTCUSDT" to "bitcoin"

  constructor(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }

  private mapBinanceSymbolToAssetId(binanceSymbol: string): string | undefined {
    return this.symbolToIdMap.get(binanceSymbol.toUpperCase());
  }

  private handleMessage = (event: MessageEvent) => {
    try {
      const message: BinanceCombinedStreamMessage = JSON.parse(event.data as string);

      if (message.data && message.data.e === '24hrTicker') {
        const assetId = this.mapBinanceSymbolToAssetId(message.data.s);
        if (!assetId) {
          // console.warn(`Received ticker for unmapped symbol: ${message.data.s}`);
          return;
        }

        const updatePayload: AssetUpdatePayload = {
          id: assetId,
          price: parseFloat(message.data.c),
          percentChange24h: parseFloat(message.data.P),
          volume24h: parseFloat(message.data.q), // Using quote asset volume
          // Note: percentChange1h, percentChange7d, and sparkline7d are not typically provided by basic ticker streams.
          // These will rely on initial data or require separate API calls for updates.
        };
        this.dispatch(updateAsset(updatePayload));
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  };

  private handleError = (event: Event) => {
    if (event instanceof ErrorEvent) {
      console.error('WebSocket ErrorEvent:', event.message, 'Type:', event.type, 'Full event:', event);
    } else {
      // For generic Event objects, try to log more details if possible, or a standard message.
      // The direct logging of 'event' often results in '{}' for simple Events.
      console.error('WebSocket generic Event:', 'Type:', event.type, 'Target:', event.target, 'Full event:', event);
    }
    // Implement more robust error handling and reconnection logic if needed
  };

  private handleClose = (event: CloseEvent) => {
    console.log('WebSocket connection closed. Code:', event.code, 'Reason:', event.reason, 'Was clean:', event.wasClean);
    this.ws = null;
    // Optional: Implement reconnection logic
    // For example, try to reconnect after a delay if the service was intentionally started
    // if (this.initialAssets.length > 0 && !event.wasClean) { // only reconnect on unclean close
    //   setTimeout(() => this.start(this.initialAssets), 5000);
    // }
  };

  public start(assets: CryptoAsset[]): void {
    if (this.ws) {
      this.stop(); // Ensure any existing connection is stopped before starting a new one
    }

    if (assets.length === 0) {
      console.warn('No assets provided to BinanceWebSocketService. WebSocket connection not started.');
      return;
    }
    this.initialAssets = [...assets]; // Store a copy for potential reconnection logic

    this.symbolToIdMap.clear();
    const streams = assets
      .map(asset => {
        const binanceSymbol = (asset.symbol + 'USDT').toUpperCase(); // e.g. BTC -> BTCUSDT
        this.symbolToIdMap.set(binanceSymbol, asset.id);
        return `${asset.symbol.toLowerCase()}usdt@ticker`; // e.g. btcusdt@ticker
      })
      .filter(stream => !!stream) // Ensure no undefined/null streams
      .join('/');
    
    if (!streams) {
        console.warn('No valid streams to subscribe to. WebSocket connection not started.');
        return;
    }

    const url = `${BINANCE_WS_URL}?streams=${streams}`;
    console.log(`Connecting to Binance WebSocket: ${url}`);

    try {
      this.ws = new WebSocket(url);
      this.ws.onopen = () => {
        console.log('Binance WebSocket connection established.');
      };
      this.ws.onmessage = this.handleMessage;
      this.ws.onerror = this.handleError; // Type is Event
      this.ws.onclose = this.handleClose; // Type is CloseEvent
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
    }
  }

  public stop(): void {
    if (this.ws) {
      // Remove event listeners to prevent them from firing during or after closure
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      // Set onclose to null specifically if we don't want the default handleClose logic (like reconnect)
      // to run when stop() is called intentionally.
      const tempWs = this.ws;
      this.ws = null; // Set to null before calling close to prevent immediate reconnect if handleClose has such logic
      tempWs.onclose = null; 
      tempWs.close(1000, "Client called stop"); // 1000 is normal closure
      console.log('Binance WebSocket connection stopped intentionally.');
    }
    // this.initialAssets = []; // Clearing initialAssets might be desired depending on reconnect strategy
  }
}
