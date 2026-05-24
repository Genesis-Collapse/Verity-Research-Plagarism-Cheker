from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request

def get_identifier(request: Request) -> str:
    # Use Bearer token as identifier if available
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ")[1]
    # Fallback to IP address
    return get_remote_address(request)

limiter = Limiter(key_func=get_identifier)
