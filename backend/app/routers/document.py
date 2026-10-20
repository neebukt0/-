from fastapi import APIRouter, HTTPException, status
from bson import ObjectId
from app.config import document_collection, user_collection 
from app.models import DocumentCreateSchema

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post('', status_code=status.HTTP_201_CREATED)
def create_document(document_data: DocumentCreateSchema):
    if not ObjectId.is_valid(document_data.author_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный формат ID автора"
        )

    author = user_collection.find_one({"_id": ObjectId(document_data.author_id)})
    if not author:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Указанный автор (пользователь) не найден"
        )


    new_document = {
        "title": document_data.title,
        "content": document_data.content,
        "status": document_data.status.value,
        "author_id": ObjectId(document_data.author_id) 
    }

    result = document_collection.insert_one(new_document)
    return {"status": "created", "id": str(result.inserted_id)}


@router.get('/{document_id}')
def get_document(document_id: str):

    if not ObjectId.is_valid(document_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный формат ID документа"
        )

    document = document_collection.find_one({"_id": ObjectId(document_id)})
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Документ не найден"
        )

    return {
        "id": str(document["_id"]),
        "title": document["title"],
        "content": document["content"],
        "status": document["status"],
        "author_id": str(document["author_id"])
    }