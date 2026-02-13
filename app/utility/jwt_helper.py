import jwt
from flask import jsonify,request
from datetime import datetime,timedelta,timezone
from functools import wraps

SECRET_KEY='es mi key de secreta'

def generate_token(user_id):
    payload={
        'user_id':str(user_id),
        'exp':datetime.now(timezone.utc)+timedelta(days=1)
    }
    token=jwt.encode(payload,SECRET_KEY,algorithm='HS256')
    return token

def verify_token(token):
    try:
        payload=jwt.decode(token,SECRET_KEY,algorithms='HS256')
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
    

def token_required(f):
    @wraps(f)
    def decorated(*args,**kwargs):
        auth_header=request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"message":"missing or invalid token"}),401
        
        token=auth_header.split(" ")[1]
        user_id=verify_token(token)

        if not user_id:
            return jsonify({"message":"invalid or expired token"}),401
        return f(user_id=user_id,*args,**kwargs)
    return decorated