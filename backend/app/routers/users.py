from fastapi import APIRouter, HTTPException, status
from app.config import user_collection
from app.models import UserRegisterSchema

router = APIRouter(prefix="/users", tags=["Users"])

@router.post('', status_code=status.HTTP_201_CREATED) 
def register(user_data: UserRegisterSchema):
    if user_data.password != user_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Пароли не совпадают"
        )

    existing_user = user_collection.find_one({
        "$or": [
            {"username": user_data.username},
            {"email": user_data.email}
        ]
    })

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким именем или email уже существует"
        )
    
    new_user = {
        'username': user_data.username, 
        'password': user_data.password,  
        'email': user_data.email,
        'phone': user_data.phone,
        'birth_date': str(user_data.birth_date),
        'role': user_data.role.value
    }
    
    result = user_collection.insert_one(new_user)
    return {"status": "created", "id": str(result.inserted_id)}



@router.post('/login')
def login(username: str, password: str):
    user = user_collection.find_one({"username": username, "password": password})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Неверное имя пользователя или пароль"
        )
        
    return {"status": "success", "user_id": str(user['_id'])}
