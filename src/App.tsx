import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { fetchAssets, selectAllAssets } from "./store/crypto-slice";
import { BinanceWebSocketService } from "./services/mock-socket";
import CryptoTable from "./components/crypto-table";
import { ShieldCheck } from "lucide-react"; 

export default function Home() {
  const dispatch = useAppDispatch();
  const assets = useAppSelector(selectAllAssets);
  const binanceWebSocketServiceRef = useRef<BinanceWebSocketService | null>(
    null
  );

  useEffect(() => {
    dispatch(fetchAssets());
  }, [dispatch]);

  useEffect(() => {
    if (assets.length > 0) {
      if (!binanceWebSocketServiceRef.current) {
        binanceWebSocketServiceRef.current = new BinanceWebSocketService(
          dispatch
        );
      }
      binanceWebSocketServiceRef.current.start(assets);
    }

    return () => {
      if (binanceWebSocketServiceRef.current) {
        binanceWebSocketServiceRef.current.stop();
        binanceWebSocketServiceRef.current = null;
      }
    };
  }, [dispatch, assets]);

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <header className="mb-8">
        <div className="flex items-center justify-start gap-3 max-w-9xl mx-auto">
          <ShieldCheck className="h-10 w-10 text-accent" />
          <h1 className="text-4xl font-bold tracking-tight text-primary">
            CryptoTracker
          </h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        <CryptoTable />
      </div>

      <footer className="mt-8 max-w-7xl mx-auto text-sm text-muted-foreground">
        <p className="text-center mb-2">
          Cryptocurrency market data.Live updates from binance
        </p>
        <p className="text-xs text-center text-muted-foreground opacity-75">
          Enhancements: Real-time updates simulate WebSocket behavior. Data is
          color-coded for quick visual cues. The table is responsive. Further
          enhancements could include real WebSocket integration,
          filters/sorting, localStorage persistence, and unit tests.
        </p>
      </footer>
    </main>
  );
}
