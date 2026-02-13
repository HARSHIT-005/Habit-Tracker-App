from flask import Flask
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
from app.routes.main_routes import main_bp
from app.routes.auth_routes import auth_bp
from app.routes.habits_routes import habit_bp
from app.routes.goals_routes import goal_bp

def create_app():
    app=Flask(__name__)
    
    # Load config from environment variables
    app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "dev_secret_key")
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    db_name = os.getenv("DB_NAME", "habit_tracker")

    client=MongoClient(mongo_uri)
    app.config['db']=client[db_name]

    
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(habit_bp)
    app.register_blueprint(goal_bp)

    return app