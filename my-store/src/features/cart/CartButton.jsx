import { useSelector, useDispatch } from 'react-redux'
import { selectCartTotalQuantity, toggleCart } from './cartSlice'
import { ShoppingBag } from 'lucide-react'

export function CartButton() {
    const dispatch = useDispatch()
    const totalQuantity = useSelector(selectCartTotalQuantity)

    return (
        <button 
            onClick={() => dispatch(toggleCart())}
            style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '8px' }}
        >
            <ShoppingBag size={24} />
            {totalQuantity > 0 && (
                <span style={{
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    background: 'red',
                    color: 'white',
                    borderRadius: '50%',
                    padding: '2px 6px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                }}>
                    {totalQuantity}
                </span>
            )}
        </button>
    )
}
