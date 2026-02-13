from flask import Blueprint,render_template,request,redirect,current_app,jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from bson.objectid import ObjectId
from app.utility.jwt_helper import token_required

main_bp=Blueprint("main",__name__)



@main_bp.route("/")
def index():
    return render_template('login.html')

@main_bp.route('/home')
def habit_page():
    
    return render_template('dashboard.html')


@main_bp.route('/api/home')
@token_required
def home(user_id):
    print("the userid inside home route is",user_id)
    db=current_app.config["db"]
    user_list=db["users"]
    user=user_list.find_one({'_id':ObjectId(user_id)})
    return jsonify({
        "username": user.get("username"),
        "consistency_score": user.get("consistency_score")
    })


@main_bp.route('/profile',methods=["Post"])
@token_required
def profile(user_id):
    return render_template('profile.html')
