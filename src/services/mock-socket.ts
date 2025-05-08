import type { AppDispatch } from '../store';
import { updateAsset, type AssetUpdatePayload } from '@/store/crypto-slice';
import type { CryptoAsset } from './crypto-data';

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/stream';

interface BinanceTickerData {
  e: string;
  E: number;
  s: string;
  p: string;
  P: string;
  w: string;
  x: string;
  c: string;
  Q: string;
  b: string;
  B: string;
  a: string;
  A: string;
  o: string;
  h: string;
  l: string;
  v: string;
  q: string;
  O: number;
  C: number;
  F: number;
  L: number;
  n: number;
}

interface BinanceCombinedStreamMessage {
  stream: string;
  data: BinanceTickerData;
}

export class BinanceWebSocketService {
  private ws: WebSocket | null = null;
  private dispatch: AppDispatch;
  private initialAssets: CryptoAsset[] = [];
  private symbolToIdMap: Map<string, string> = new Map();

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
        if (!assetId) return;

        const updatePayload: AssetUpdatePayload = {
          id: assetId,
          price: parseFloat(message.data.c),
          percentChange24h: parseFloat(message.data.P),
          volume24h: parseFloat(message.data.q),
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
      console.error('WebSocket generic Event:', 'Type:', event.type, 'Target:', event.target, 'Full event:', event);
    }
  };

  private handleClose = (event: CloseEvent) => {
    console.log('WebSocket connection closed. Code:', event.code, 'Reason:', event.reason, 'Was clean:', event.wasClean);
    this.ws = null;

    // Auto-reconnect on unclean close
    if (this.initialAssets.length > 0 && !event.wasClean) {
      console.log('Attempting to reconnect in 5 seconds...');
      setTimeout(() => this.start(this.initialAssets), 5000);
    }
  };

  public start(assets: CryptoAsset[]): void {
    if (this.ws) {
      this.stop(); // Ensure any existing connection is stopped
    }

    if (assets.length === 0) {
      console.warn('No assets provided to BinanceWebSocketService. WebSocket connection not started.');
      return;
    }

    this.initialAssets = [...assets]; // Save for potential reconnection
    this.symbolToIdMap.clear();

    const streams = assets
      .map(asset => {
        const binanceSymbol = (asset.symbol + 'USDT').toUpperCase();
        this.symbolToIdMap.set(binanceSymbol, asset.id);
        return `${asset.symbol.toLowerCase()}usdt@ticker`;
      })
      .filter(stream => !!stream)
      .join('/');

    if (!streams) {
      console.warn('No valid streams to subscribe to. WebSocket connection not started.');
      return;
    }

    const url = `${BINANCE_WS_URL}?streams=${streams}`;
    console.log(`Connecting to Binance WebSocket: ${url}`);

    try {
      this.ws = new WebSocket(url);
      this.ws.onopen = () => console.log('Binance WebSocket connection established.');
      this.ws.onmessage = this.handleMessage;
      this.ws.onerror = this.handleError;
      this.ws.onclose = this.handleClose;
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
    }
  }

  public stop(): void {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      const tempWs = this.ws;
      this.ws = null;
      tempWs.onclose = null;
      tempWs.close(1000, "Client called stop");
      console.log('Binance WebSocket connection stopped intentionally.');
    }

    this.initialAssets = [];
  }
}
