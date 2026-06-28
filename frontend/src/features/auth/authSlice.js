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
   REGISTER THUNK
   Registers the user, then auto-logs them in.
=========================== */

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ name, email, password, role }, { dispatch, rejectWithValue }) => {
    try {
      // 1. Register the user on the backend
      await axios.post('/auth/register', { name, email, password, role });

      // 2. Auto-login: dispatch the existing loginUser thunk
      //    This gives us proper tokens + user object in Redux state
      const loginResult = await dispatch(loginUser({ email, password }));

      // 3. If login failed after register, surface that error
      if (loginUser.rejected.match(loginResult)) {
        return rejectWithValue('Registered but auto-login failed. Please login manually.');
      }

      return loginResult.payload; // { accessToken, user }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Registration failed'
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
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    }
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
      })
      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        // user & token are already set by the loginUser thunk inside register
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, updateUser } = authSlice.actions;
export default authSlice.reducer;