from flask import Blueprint, current_app,render_template,redirect,request,jsonify
from werkzeug.security import check_password_hash,generate_password_hash
from bson.objectid import ObjectId
from datetime import datetime

from app.utility.jwt_helper import generate_token

from app.db_setup import user_list
auth_bp=Blueprint('auth',__name__)

@auth_bp.route('/login',methods=["Post"])
def login():
    data=request.get_json()
    email=data.get("email")
    password=data.get("password")

    user=user_list.find_one({"email":email})
    
    if user and check_password_hash(user["password"],password): # type: ignore
        token=generate_token(user['_id'])
        print("the token in login route is ",token)
        return jsonify({"message":"login successfully","token":token}),200
    else:
        return jsonify({"message":"invalid credentials"}),401


@auth_bp.route('/signup',methods=["Post"])
def signup():
    username=request.form.get("Username")
    dob=request.form.get("dob")
    email=request.form.get("email")
    password=request.form.get("password")

    if not (username and dob and email and password):
        return jsonify({"message": "All fields are required"}), 400
    existing_user=user_list.find_one({"email":email})
    if existing_user:
        return jsonify({"message": "User already exists"}), 409
    else:
        hashed_pass=generate_password_hash(password)
        dob = datetime.strptime(dob, "%Y-%m-%d")
        user_data={
            "username":username,
            "email":email,
            "dob":dob,
            "password":hashed_pass,
            "consistency_score":0
        }
        user_list.insert_one(user_data)
        new_user = user_list.find_one({"email": email})
        token = generate_token(new_user['_id'])
        return jsonify({"message": "Signup successful", "token": token}), 201


