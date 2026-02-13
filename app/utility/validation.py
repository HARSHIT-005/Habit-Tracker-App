from functools import wraps
from flask import request, jsonify
import re

def validate_schema(schema):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            data = request.get_json()
            if not data:
                return jsonify({"message": "No input data provided"}), 400
            
            validator = schema.get('validator', {}).get('$jsonSchema', {})
            required = validator.get('required', [])
            properties = validator.get('properties', {})
            
            # Check required fields
            missing = [field for field in required if field not in data]
            if missing:
                return jsonify({"message": f"Missing required fields: {', '.join(missing)}"}), 400
            
            # Check types and constraints
            for field, value in data.items():
                if field in properties:
                    field_schema = properties[field]
                    bson_type = field_schema.get('bsonType')
                    
                    # Type validation
                    if bson_type == 'string' and not isinstance(value, str):
                        return jsonify({"message": f"Field '{field}' must be a string"}), 400
                    elif bson_type == 'int' and not isinstance(value, int):
                        # Allow converting string to int if strictly numeric? No, strict JSON types.
                        return jsonify({"message": f"Field '{field}' must be an integer"}), 400
                    elif bson_type == 'bool' and not isinstance(value, bool):
                        return jsonify({"message": f"Field '{field}' must be a boolean"}), 400
                    
                    # Enum validation
                    if 'enum' in field_schema and value not in field_schema['enum']:
                        return jsonify({"message": f"Field '{field}' must be one of {field_schema['enum']}"}), 400
                        
                    # Pattern validation (simple regex)
                    if 'pattern' in field_schema and bson_type == 'string':
                        if not re.match(field_schema['pattern'], value):
                            return jsonify({"message": f"Field '{field}' does not match required pattern"}), 400

            return f(*args, **kwargs)
        return wrapper
    return decorator
