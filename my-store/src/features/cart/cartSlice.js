import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    items: [],
    isOpen: false,
}

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        toggleCart: (state) => {
            state.isOpen = !state.isOpen
        },
        addToCart: (state, action) => {
            const existingItem = state.items.find(item => item.id === action.payload.id)
            if (existingItem) {
                existingItem.quantity += 1
            } else {
                state.items.push({ ...action.payload, quantity: 1 })
            }
        },
        removeFromCart: (state, action) => {
            state.items = state.items.filter(item => item.id !== action.payload)
        },
        updateQuantity: (state, action) => {
            const { id, quantity } = action.payload
            const item = state.items.find(item => item.id === id)
            if (item) {
                item.quantity = quantity
            }
        },
    },
})

export const { toggleCart, addToCart, removeFromCart, updateQuantity } = cartSlice.actions

export const selectCartItems = (state) => state.cart.items
export const selectCartTotalQuantity = (state) => 
    state.cart.items.reduce((total, item) => total + item.quantity, 0)
export const selectCartTotalPrice = (state) => 
    state.cart.items.reduce((total, item) => total + item.price * item.quantity, 0)

export default cartSlice.reducer
