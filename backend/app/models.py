from enum import Enum
from datetime import date
from pydantic import BaseModel, EmailStr, Field

class UserRole(str, Enum):
    USER = 'user'
    ADMIN = 'admin'
    EMPLOYEE = 'employee'

class UserRegisterSchema(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr  
    phone: str = Field(..., description="Номер телефона")
    birth_date: date  
    password: str = Field(..., min_length=6)
    confirm_password: str
    role: UserRole = UserRole.USER  

class DocumentStatus(str, Enum):
    CREATED = 'created'
    REVIVED = 'reviewed'
    APPROVED = 'approved'

class DocumentCreateSchema(BaseModel):
    title: str = Field(..., min_length=3, max_length=255, description="Название документа")
    content: str = Field(..., description="Содержимое или текст документа")
    status: DocumentStatus = DocumentStatus.CREATED.value
    author_id: int = Field(..., description="ID пользователя, создавшего документ")



