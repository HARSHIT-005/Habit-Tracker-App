from flask import render_template,redirect,current_app,Blueprint,session,jsonify,request
from datetime import datetime, timedelta, timezone
from bson.objectid import ObjectId
from app.db_setup import user_list,habit_list
import jwt
from app.utility.jwt_helper import token_required
from app.utility.validation import validate_schema
from app.models.schemas import habit_schema, habit_input_schema

habit_bp=Blueprint('habit',__name__)



@habit_bp.route('/api/habits')
@token_required
def hab(user_id):
    now = datetime.now(timezone.utc)
    habits = list(habit_list.find({"user_id": ObjectId(user_id)}))
    
    updated_habits = []
    for habit in habits:
        changed = False
        freq = habit.get("frequency", "daily")
        last_comp = habit.get("last_completed_date")
        
        # Calculate start of current period
        if freq == "daily":
            period_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            break_threshold = period_start - timedelta(days=1)
        elif freq == "weekly":
            # Monday is start of week
            period_start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
            break_threshold = period_start - timedelta(weeks=1)
        elif freq == "monthly":
            period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            # Threshold is start of previous month
            if period_start.month == 1:
                break_threshold = period_start.replace(year=period_start.year-1, month=12)
            else:
                break_threshold = period_start.replace(month=period_start.month-1)
        else:
            period_start = now
            break_threshold = now

        # If last completion was before current period, reset completed_today
        if not last_comp or last_comp.replace(tzinfo=timezone.utc) < period_start:
            if habit.get("completed_today"):
                habit["completed_today"] = False
                changed = True
        
        # Streak break logic: if last completion was even before the previous period
        if last_comp:
            last_comp_utc = last_comp.replace(tzinfo=timezone.utc)
            if last_comp_utc < break_threshold:
                if habit.get("streak", 0) > 0:
                    habit["streak"] = 0
                    changed = True
        elif not last_comp and habit.get("streak", 0) > 0:
            # Should not happen but for safety
            habit["streak"] = 0
            changed = True

        if changed:
            habit_list.update_one(
                {"_id": habit["_id"]},
                {"$set": {"completed_today": habit["completed_today"], "streak": habit["streak"]}}
            )

        habit["_id"] = str(habit["_id"])
        habit["user_id"] = str(habit["user_id"])
        updated_habits.append(habit)

    return jsonify(updated_habits)

@habit_bp.route('/api/habits/<string:habit_id>', methods=["PATCH"])
@token_required
def update_habit(user_id, habit_id):
    data = request.get_json()
    completed = data.get('completed_today')
    streak = data.get('streak')
    
    update_data = {
        "completed_today": completed,
        "streak": streak
    }
    
    if completed:
        update_data["last_completed_date"] = datetime.now(timezone.utc)
    # Note: We don't null out last_completed_date if un-completed 
    # as it represents the last time it WAS done.
    
    habit_list.update_one(
        {'_id': ObjectId(habit_id), 'user_id': ObjectId(user_id)},
        {'$set': update_data}
    )
    return jsonify({"message": "habit updated successfully"})

@habit_bp.route('/api/add_habit',methods=["POST"])
@token_required
@validate_schema(habit_input_schema)
def add_habit(user_id):
    
    data=request.get_json()
   
    habit={
        "user_id":ObjectId(user_id),
        "title":data["title"],
        "frequency":data["frequency"],
        "completed_today":False,
        "streak":0,
        "last_completed_date": None,
        "category":data["category"]
    }
   
    result = habit_list.insert_one(habit)
    return jsonify({"message": "Habit added"}), 201 

@habit_bp.route('/api/deletehabit/<string:habitid>',methods=["DELETE"])
@token_required
def delete_habit(user_id,habitid):
    
    habit_list.delete_one({"_id":ObjectId(habitid)})
    return jsonify({"message":"habit deleted successfully"}),200

