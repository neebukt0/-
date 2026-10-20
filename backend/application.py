# python -m uvicorn application:app --reload --port 8001


import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import users 
from app.routers import document

app = FastAPI(title='test')


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(users.router)
app.include_router(document.router)

@app.get("/")
def home():
    return {"message": "API работает, база подключена!"}

if __name__ == "__main__":

    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
