import { fetchProducts } from './features/products/productSlice'
import { useDispatch } from 'react-redux'
import { ProductList } from './features/products/ProductList'
import { CartButton } from './features/cart/CartButton'
import { CartDrawer } from './features/cart/CartDrawer'

function App() {
  return (
    <>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderBottom: '1px solid #eaeaea' }}>
        <h1>My Store</h1>
        <CartButton />
      </header>
      <main style={{ padding: '2rem' }}>
        <ProductList />
      </main>
      <CartDrawer />
    </>
  )
}

export default App
