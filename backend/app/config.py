import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

db_user = os.getenv("mongo_client")
client = MongoClient(db_user)
db = client['my_database_document']

document_collection = db['document_collection']
user_collection = db['user_collection']
