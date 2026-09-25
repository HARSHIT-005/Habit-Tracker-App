import jwt
from flask import jsonify,request
from datetime import datetime,timedelta,timezone
from functools import wraps
import os

SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev_jwt_secret_key')
ACCESS_TOKEN_MINUTES = 15
REFRESH_TOKEN_DAYS = 7

def generate_token(user_id, token_type='access'):
    lifetime = timedelta(minutes=ACCESS_TOKEN_MINUTES)
    if token_type == 'refresh':
        lifetime = timedelta(days=REFRESH_TOKEN_DAYS)

    payload={
        'user_id':str(user_id),
        'type': token_type,
        'exp':datetime.now(timezone.utc)+lifetime
    }
    token=jwt.encode(payload,SECRET_KEY,algorithm='HS256')
    return token

def verify_token(token, expected_type='access'):
    try:
        payload=jwt.decode(token,SECRET_KEY,algorithms='HS256')
        if payload.get('type') != expected_type:
            return None
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