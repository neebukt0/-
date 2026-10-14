import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "./productSlice";

export function ProductList() {
    const dispatch = useDispatch()
    const {items, status, error} = useSelector((state) => state.products)

    useEffect(() => {
        if(status === 'idle'){
            dispatch(fetchProducts())
        }
    }, [dispatch, status])

    if(status === 'loading') {
        return <div>Загрузка товаров...</div>
    }

    if(status === 'failed') {
        return <div style={{color: 'red'}}>{error}</div>
    }

    return (
        <div style={{padding: '20px'}}>
            <h2>Каталог товаров</h2>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px'}}>
                {items.map((product) => (
                    <div 
                        key={product.id}
                        style={{border: '1px solid #ccc', padding: '12px', borderRadius: '8px',
                            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                        }}  
                    >
                        <img src={product.image} alt="" />
                        <h4>{product.title}</h4>
                        <p>{product.description}</p>
                        <p>{product.cost}</p>
                        <button type="button">Добавить в корзину</button>
                    </div>
                ))}
            </div>
        </div>
    )
}