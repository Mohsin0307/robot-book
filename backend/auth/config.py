"""Authentication configuration using Better-Auth principles."""

import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Session Configuration
SESSION_SECRET = os.getenv("SESSION_SECRET")
SESSION_EXPIRE_DAYS = 7

# Password hashing configuration
BCRYPT_ROUNDS = 12

if not JWT_SECRET or not SESSION_SECRET:
    raise ValueError("JWT_SECRET and SESSION_SECRET must be set in environment")


def get_token_expiration() -> timedelta:
    """Get token expiration timedelta."""
    return timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
