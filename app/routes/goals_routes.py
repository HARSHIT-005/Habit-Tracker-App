from flask import jsonify,Blueprint
from bson.objectid import ObjectId
from app.utility.jwt_helper import token_required
from app.db_setup import goals_list
goal_bp=Blueprint("goal",__name__)

@goal_bp.route('/api/goals',methods=["GET"])
@token_required
def goal(user_id):
    goals=list(goals_list.find({"user_id":ObjectId(user_id)}))
   
    for goal in goals:
        goal["_id"]=str(goal["_id"])
        goal["user_id"]=str(goal["user_id"])
        goal["habit_id"]=str(goal["habit_id"])
    print("goals list is ",jsonify(goals))
    return jsonify(goals)