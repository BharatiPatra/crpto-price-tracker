import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { CryptoAsset} from '../services/crypto-data';
import { getCryptoAssets } from '../services/crypto-data';
import type { RootState } from './index';

interface CryptoState {
  assets: CryptoAsset[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null | undefined;
}

const initialState: CryptoState = {
  assets: [],
  status: 'idle',
  error: null,
};

export const fetchAssets = createAsyncThunk('crypto/fetchAssets', async () => {
  const response = await getCryptoAssets();
  return response;
});

export interface AssetUpdatePayload {
  id: string;
  price?: number;
  percentChange1h?: number;
  percentChange24h?: number;
  percentChange7d?: number;
  volume24h?: number;
  sparkline7d?: number[];
}

const cryptoSlice = createSlice({
  name: 'crypto',
  initialState,
  reducers: {
    updateAsset: (state, action: PayloadAction<AssetUpdatePayload>) => {
        const assetIndex = state.assets.findIndex(asset => asset.id === action.payload.id);
        if (assetIndex !== -1) {
          if (action.payload.price && !action.payload.sparkline7d) {
            const currentSparkline = [...state.assets[assetIndex].sparkline7d];
            const newSparkline = [...currentSparkline.slice(1), action.payload.price];
            
            state.assets[assetIndex] = { 
              ...state.assets[assetIndex], 
              ...action.payload,
              sparkline7d: newSparkline
            };
          } else {
            // Standard update without modifying sparkline
            state.assets[assetIndex] = { ...state.assets[assetIndex], ...action.payload };
          }
        }
      },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssets.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAssets.fulfilled, (state, action: PayloadAction<CryptoAsset[]>) => {
        state.status = 'succeeded';
        state.assets = action.payload;
      })
      .addCase(fetchAssets.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { updateAsset } = cryptoSlice.actions;

export const selectAllAssets = (state: RootState) => state.crypto.assets;
export const selectAssetsStatus = (state: RootState) => state.crypto.status;
export const selectAssetsError = (state: RootState) => state.crypto.error;

export default cryptoSlice.reducer;
