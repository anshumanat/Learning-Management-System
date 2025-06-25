import { createSlice } from "@reduxjs/toolkit";

// Retrieve token from localStorage outside the initialState object
const token = localStorage.getItem('token');

const initialState = {
  signupData: null,
  loading: false,
  token: token, 
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSignupData(state, action) {
      state.signupData = action.payload;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setToken(state, action) {
      state.token = action.payload;
    },
  },
});

export const { setSignupData, setLoading, setToken } = authSlice.actions;

export default authSlice.reducer;
