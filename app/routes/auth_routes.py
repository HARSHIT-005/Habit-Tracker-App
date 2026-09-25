from flask import Blueprint, current_app,render_template,redirect,request,jsonify,make_response
from werkzeug.security import check_password_hash,generate_password_hash
from bson.objectid import ObjectId
from datetime import datetime

from app.utility.jwt_helper import generate_token,verify_token

from app.db_setup import user_list
auth_bp=Blueprint('auth',__name__)

def auth_response(message, user_id, status):
    response = make_response(jsonify({
        "message": message,
        "access_token": generate_token(user_id)
    }), status)
    response.set_cookie(
        'refresh_token',
        generate_token(user_id, 'refresh'),
        httponly=True,
        secure=False,
        samesite='Lax',
        max_age=7 * 24 * 60 * 60
    )
    return response

@auth_bp.route('/login',methods=["Post"])
def login():
    data=request.get_json()
    email=data.get("email")
    password=data.get("password")

    user=user_list.find_one({"email":email})
    
    if user and check_password_hash(user["password"],password): # type: ignore
        return auth_response("login successfully", user['_id'], 200)
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
        return auth_response("Signup successful", new_user['_id'], 201)


@auth_bp.route('/refresh', methods=["POST"])
def refresh():
    refresh_token = request.cookies.get('refresh_token')
    if not refresh_token:
        return jsonify({"message": "missing refresh token"}), 401

    user_id = verify_token(refresh_token, 'refresh')
    if not user_id:
        return jsonify({"message": "invalid or expired refresh token"}), 401

    return jsonify({"access_token": generate_token(user_id)}), 200


@auth_bp.route('/logout', methods=["POST"])
def logout():
    response = make_response(jsonify({"message": "logged out"}), 200)
    response.delete_cookie('refresh_token')
    return response


