from pymongo import MongoClient
from app.models.schemas import user_schema,habit_schema,goal_schema,progress_schema
import os
from dotenv import load_dotenv

load_dotenv()

mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
db_name = os.getenv("DB_NAME", "habit_tracker")

client=MongoClient(mongo_uri)
db=client[db_name]
user_list=db["users"]
habit_list=db["habits"]
goals_list=db["goals"]

def create_collection_with_schema(db,name,schema):
    if name in db.list_collection_names():
        print(f"`{name}` collection already exists and was left unchanged")
       
    else:
        db.create_collection(name,validator=schema["validator"])
        print(f"`{name}` collection created successfully")


create_collection_with_schema(db,"users",user_schema)
create_collection_with_schema(db,"habits",habit_schema)
create_collection_with_schema(db,"progress",progress_schema)
create_collection_with_schema(db,"goals",goal_schema)