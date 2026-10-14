import { useSelector, useDispatch } from 'react-redux'
import { selectCartItems, selectCartTotalPrice, toggleCart } from './cartSlice'
import { CartItem } from './CartItem'
import { X } from 'lucide-react'

export function CartDrawer() {
    const dispatch = useDispatch()
    const isOpen = useSelector((state) => state.cart.isOpen)
    const items = useSelector(selectCartItems)
    const totalPrice = useSelector(selectCartTotalPrice)

    if (!isOpen) {
        return null
    }

    const handleCheckout = () => {
        alert('Заказ успешно оформлен!')
    }

    return (
        <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: '350px', background: '#fff', boxShadow: '-2px 0 5px rgba(0,0,0,0.1)', padding: '20px', display: 'flex', flexDirection: 'column', zIndex: 1000 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Корзина</h2>
                <button onClick={() => dispatch(toggleCart())} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={24} />
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
                {items.length === 0 ? (
                    <p>Корзина пуста</p>
                ) : (
                    items.map((item) => (
                        <CartItem item={item} key={item.id} />
                    ))
                )}
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontWeight: 'bold' }}>
                    <span>Итого:</span>
                    <span>${totalPrice.toFixed(2)}</span>
                </div>
                <button 
                    onClick={handleCheckout} 
                    style={{ width: '100%', padding: '10px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer' }}
                >
                    Оформить заказ
                </button>
            </div>
        </div>
    )
}
