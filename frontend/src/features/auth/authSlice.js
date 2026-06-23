import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../utils/axiosInstance';
import { jwtDecode } from 'jwt-decode';

/* ===========================
   INITIAL STATE (HYDRATION)
=========================== */

const accessToken = localStorage.getItem('accessToken');

let initialState = {
  user: null,
  token: null,
  loading: false,
  error: null,
};

if (accessToken) {
  try {
    const decoded = jwtDecode(accessToken);

    // FIX: Check for expiry AND missing role. 
    // If the token doesn't have a role, it's useless for permission checking.
    if ((decoded.exp * 1000 < Date.now()) || !decoded.role) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } else {
      initialState.user = decoded;
      initialState.token = accessToken;
    }
  } catch (e) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

/* ===========================
   LOGIN THUNK
=========================== */

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await axios.post('/auth/login', { email, password });
      
      // The backend returns { _id, name, role, accessToken, refreshToken }
      const { accessToken, refreshToken, role, name, _id } = res.data;

      if (!accessToken) throw new Error('Invalid access token');

      // Save tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // FIX: Construct the user object from the Response first.
      // This ensures we have the 'role' immediately, even if the token payload is thin.
      const user = { 
        id: _id,
        name: name,
        role: role, 
        ...jwtDecode(accessToken) // Merge with token data if needed
      };

      return { accessToken, user };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Login failed'
      );
    }
  }
);

/* ===========================
   SLICE
=========================== */

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      state.user = null;
      state.token = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.accessToken;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;