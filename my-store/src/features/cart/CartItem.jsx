import { useDispatch } from 'react-redux'
import { updateQuantity, removeFromCart } from './cartSlice'

export function CartItem({ item }) {
    const dispatch = useDispatch()

    const handleDecrease = () => {
        if (item.quantity > 1) {
            dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))
        }
    }

    const handleIncrease = () => {
        dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))
    }

    const handleRemove = () => {
        dispatch(removeFromCart(item.id))
    }

    return (
        <div className="cart-item">
            <img src={item.image} alt={item.title} className="cart-item-image" />
            <div className="cart-item-details">
                <h4>{item.title}</h4>
                <p>${item.price}</p>
            </div>
            <div className="cart-item-actions">
                <button 
                    onClick={handleDecrease} 
                    disabled={item.quantity <= 1}
                >
                    -
                </button>
                <span>{item.quantity}</span>
                <button onClick={handleIncrease}>
                    +
                </button>
            </div>
            <button onClick={handleRemove} className="cart-item-remove">
                🗑
            </button>
        </div>
    )
}
