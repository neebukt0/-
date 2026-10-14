import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchProducts = createAsyncThunk(
    // pending rejected fullfilled
    'products/fetchProducts',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('https://fakestoreapi.com/products')
            return response.data
        } catch (error) {
            return rejectWithValue(error.message || 'Ошибка при загрузке товаров...')
        }
    }
)

const initialState = {
    items: [],
    status: 'idle',
    error: null
}


const productsSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {

    },
    extraReducers: (builder) => {
        builder
        .addCase(fetchProducts.pending, (state) => {
            state.status = 'loading',
            state.error = null
            console.log(state.status);
            console.log('--------------------');
            
        })
        .addCase(fetchProducts.fulfilled, (state, action) => {
            state.status = 'succeded',
            state.items = action.payload
            console.log(state.status);
            console.log(state.items);
            console.log('--------------------');
        })
        .addCase(fetchProducts.rejected, (state, action) => {
            state.status = 'failed',
            state.error = action.payload
            console.log(state.status);
            console.log(state.error);
            console.log('--------------------');
        })
    }
})

export default productsSlice.reducer