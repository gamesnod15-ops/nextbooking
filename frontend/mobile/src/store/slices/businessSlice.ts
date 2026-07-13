import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Business } from '@/types';

interface BusinessState {
  business: Business | null;
  isLoading: boolean;
}

const initialState: BusinessState = {
  business: null,
  isLoading: false,
};

const businessSlice = createSlice({
  name: 'business',
  initialState,
  reducers: {
    setBusiness(state, action: PayloadAction<Business>) {
      state.business = action.payload;
    },
    clearBusiness(state) {
      state.business = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const { setBusiness, clearBusiness, setLoading } = businessSlice.actions;
export default businessSlice.reducer;
