# 🪙 Crypto Price Tracker

A real-time cryptocurrency price tracker built with **React**, **Redux Toolkit**, and **TypeScript**, using **Binance WebSocket API** for live updates.

## 🚀 Features

- 📈 Real-time price updates via Binance WebSocket
- 🔄 Redux Toolkit for efficient global state management
- 💻 Built with TypeScript for type safety
- 🧩 Modular structure with reusable components
- ⚡ Smooth and responsive UI

## 🗂️ Folder Structure

```
project-root/
├── public/
├── src/
│   ├── components/      # Reusable React components
│   ├── lib/             # Utility functions
│   ├── services/        # WebSocket connection logic
│   ├── store/           # Redux slices and store config
├── app.tsx              # Root component
├── app.css              # App-level styles
├── index.css            # Global styles
├── main.tsx             # Entry point
```

## 🧪 Technologies Used

- React
- Redux Toolkit
- TypeScript
- Binance WebSocket API
- Shadcn ui

## 🔧 Installation

```bash
# Clone the repository
git clone https://github.com/BharatiPatra/crpto-price-tracker.git
cd crypto-price-tracker

# Install dependencies
npm install
# or
yarn
```

## ▶️ Running the App

```bash
npm run dev
# or
yarn dev
```

Open `http://localhost:5173` (or appropriate port) in your browser to view the app.

## 🌐 WebSocket Source

This project uses Binance’s WebSocket stream:
```
wss://stream.binance.com:9443/ws/{symbol}@ticker
```

Example: `btcusdt@ticker` for real-time BTC/USDT updates.

## 📁 Example Redux Structure

```ts
// store/priceSlice.ts
interface PriceState {
  symbol: string;
  price: string;
}
```

## ✨ Screenshots

> _You can add screenshots here to showcase the UI._

## 📜 License

MIT License

---

> Developed by [E. Bharati Patra](https://portfolio-bharatipatra.vercel.app/)
