import { useState } from 'react'
import { fetchProducts } from './features/products/productSlice'
import { useDispatch } from 'react-redux'
import { ProductList } from './features/products/ProductList'
function App() {


  return (
    <>
      <ProductList />
    </>
  )
}

export default App
