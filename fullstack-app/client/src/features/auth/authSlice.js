import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api/axios';

// 1. ASYNC THUNK: РЕГИСТРАЦИЯ
export const registerUser = createAsyncThunk(
  'auth/register',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', credentials);
      return response.data; // Возвращает { accessToken, user }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка регистрации');
    }
  }
);

// 2. ASYNC THUNK: ВХОД
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data; // Возвращает { accessToken, user }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка входа');
    }
  }
);

// 3. ASYNC THUNK: ТИХОЕ ОБНОВЛЕНИЕ СЕССИИ ПРИ ПЕРЕЗАГРУЗКЕ СТРАНИЦЫ
export const checkAuth = createAsyncThunk(
  'auth/check',
  async (_, { rejectWithValue }) => {
    try {
      // Идем на /refresh, сервер прочитает HttpOnly куку и вернет новый Access Token
      const response = await api.get('/auth/refresh');
      return response.data;
    } catch (error) {
      return rejectWithValue('Неавторизован');
    }
  }
);

// 4. ASYNC THUNK: ВЫХОД
export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await api.post('/auth/logout');
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,         // Данные пользователя { userId, email }
    accessToken: null,  // Access Token хранится ТОЛЬКО В ПАМЯТИ REDUX
    isLoading: true,    // Идет ли первичная проверка сессии
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Регистрация
      .addCase(registerUser.fulfilled, (state, action) => {
        console.log("Register fulfilled");
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.error = null;
        state.isLoading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Логин
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log("Login fulfilled");
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.error = null;
        state.isLoading = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Проверка сессии (checkAuth)
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        console.log("checkAuth.fulfilled");
        
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isLoading = false;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isLoading = false;
      })
      // Выход
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;