from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.responses import RedirectResponse, JSONResponse, Response, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
from typing import Optional
import uvicorn
import os

from database import (
    init_db, insert_url, insert_url_with_code, get_url, increment_clicks, get_stats,
    create_user, get_user_by_email, get_user_by_id, get_user_links
)

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")

app = FastAPI(title="URL Shortener")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files at /static
app.mount("/landing_static", StaticFiles(directory="public/static"), name="landing_static_files")
# Mount for React app's bundled static assets (CSS, JS, media within its own 'static' folder)
app.mount("/static", StaticFiles(directory="analytics-dashboard/build/static"), name="react_app_static_content")

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase): # This effectively replaces UserRegister
    password: str

class User(UserBase):
    id: int
    # Add other fields you want to return about a user, e.g., is_active: bool
    class Config:
        orm_mode = True # For compatibility with ORM objects if you use one

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None # Corresponds to 'sub' claim in JWT

class ShortenRequest(BaseModel):
    url: str
    custom_code: Optional[str] = None

# --- Auth Setup ---
SECRET_KEY = os.getenv("SECRET_KEY", "devsecret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    from datetime import datetime, timedelta
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    # Ensure 'sub' is a string if present
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print("Decoded JWT payload:", payload)  # DEBUG
        user_id: int = payload.get("sub")
        if user_id is None:
            print("No user_id in token payload")  # DEBUG
            raise credentials_exception
    except JWTError as e:
        print("JWTError:", e)  # DEBUG
        raise credentials_exception
    user = await get_user_by_id(user_id)
    print("User from DB:", user)  # DEBUG
    if user is None:
        print("No user found for user_id", user_id)  # DEBUG
        raise credentials_exception
    return user


@app.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED) # Changed response_model
async def signup_user(user_in: UserCreate):
    db_user = await get_user_by_email(email=user_in.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    hashed_password = get_password_hash(user_in.password)
    await create_user(email=user_in.email, hashed_password=hashed_password)
    
    newly_created_user = await get_user_by_email(email=user_in.email)
    if not newly_created_user:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="User created but could not be retrieved for token generation.")
    
    # Create access token for the new user
    # newly_created_user.id will be an int from the User model.
    # create_access_token handles converting 'sub' to string.
    access_token = create_access_token(data={"sub": newly_created_user['id']}) 
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    print(f"--- Login attempt for username: {form_data.username} ---") # DEBUG
    
    # user_data will be a dictionary like {'id': ..., 'email': ..., 'hashed_password': ...} or None
    user_data = await get_user_by_email(email=form_data.username)
    print(f"User data from DB: {user_data}") # DEBUG

    if not user_data:
        print("Login failed: User not found in DB.") # DEBUG
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if 'hashed_password' key exists in the dictionary
    if 'hashed_password' not in user_data:
        print(f"Login failed: User data for {form_data.username} missing 'hashed_password' key.") # DEBUG
        # This indicates a potential issue with data consistency or how get_user_by_email returns data
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="User data integrity issue.", 
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"Plain password from form: '{form_data.password}'") # DEBUG
    print(f"Hashed password from DB: '{user_data['hashed_password']}'") # DEBUG
    
    password_verified = verify_password(form_data.password, user_data['hashed_password'])
    print(f"Password verification result: {password_verified}") # DEBUG

    if not password_verified:
        print("Login failed: Password verification returned False.") # DEBUG
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if 'id' key exists for token creation
    if 'id' not in user_data:
        print(f"Login failed: User data for {form_data.username} missing 'id' key after password verification.") # DEBUG
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User data is missing ID, cannot create token."
        )

    print(f"Login successful for user ID: {user_data['id']}. Creating token.") # DEBUG
    access_token_data = {"sub": str(user_data['id'])}
    access_token = create_access_token(data=access_token_data)
    return {"access_token": access_token, "token_type": "bearer"}


@app.on_event("startup")
async def on_startup():
    await init_db()

@app.get("/", include_in_schema=False)
async def root():
    return FileResponse("public/index.html")

@app.get("/favicon.ico")
async def favicon():
    # Return a blank icon to prevent 404 errors in browsers
    return Response(content=b"", media_type="image/x-icon")

@app.get("/{page_name}.html", include_in_schema=False)
async def serve_html(page_name: str):
    file_path = os.path.join("public", f"{page_name}.html")
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return JSONResponse({"detail": "URL not found"}, status_code=404)

# Routes to serve the React Single Page Application
@app.get("/dashboard", include_in_schema=False)
@app.get("/my-links", include_in_schema=False)
@app.get("/settings", include_in_schema=False)
@app.get("/analytics/{rest_of_path:path}", include_in_schema=False) # Handles /analytics and /analytics/*
async def serve_react_app_page(request: Request):
    return FileResponse("analytics-dashboard/build/index.html")

import re

# Optional auth scheme for endpoints where login is not required
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/login", auto_error=False)

@app.post("/shorten")
async def shorten_url(
    req: ShortenRequest,
    token: str = Depends(oauth2_scheme_optional)
):
    user_id = None
    current_user = None
    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = int(payload.get("sub"))
            current_user = await get_user_by_id(user_id)
            if not current_user:
                user_id = None
        except Exception:
            user_id = None
    # If custom_code is requested, require authentication
    if req.custom_code:
        if not user_id:
            raise HTTPException(status_code=401, detail="Login required for custom codes.")
        custom = req.custom_code.strip()
        if not (3 <= len(custom) <= 20) or not re.fullmatch(r"[A-Za-z0-9]+", custom):
            raise HTTPException(status_code=400, detail="Custom code must be alphanumeric and 3-20 characters long.")
        ok = await insert_url_with_code(req.url, custom, user_id)
        if not ok:
            raise HTTPException(status_code=409, detail="Custom code is already taken.")
        code = custom
    else:
        code = await insert_url(req.url, user_id)
    short_url = f"{BASE_URL}/{code}"
    return {"short_url": short_url, "code": code}


@app.get("/my-links")
async def my_links(current_user: dict = Depends(get_current_user)):
    links = await get_user_links(current_user["id"])
    return {"links": links}

# NEW ROUTE: To serve the React Single Page Application
# This should be placed BEFORE the @app.get("/{code}") redirector route
@app.get("/{full_path:path}", include_in_schema=False)
async def serve_react_spa(full_path: str):
    print(f"--- SPA HANDLER: Path: '{full_path}' ---")

    # Check for known React app root files first
    known_root_files = ["manifest.json", "favicon.ico", "logo192.png", "logo512.png"] # Add others if needed
    if full_path in known_root_files:
        file_path = os.path.join("analytics-dashboard/build", full_path)
        if os.path.exists(file_path):
            print(f"SPA HANDLER: Serving known root file: {file_path}")
            return FileResponse(file_path)
        else:
            print(f"SPA HANDLER: Known root file NOT FOUND: {file_path}")
            return JSONResponse(status_code=404, content={"detail": f"File '{full_path}' not found."})

    # If not a known root file, and not an API/static call (which should be caught by other routes/mounts),
    # assume it's a route for the SPA, so serve index.html.
    # The /static mount for analytics-dashboard/build/static should handle CSS/JS chunks.
    if full_path.startswith("api/") or full_path.startswith("static/") or full_path.startswith("landing_static/"):
        print(f"SPA HANDLER: Path '{full_path}' should have been caught by API or static mounts. This is unexpected.")
        return JSONResponse(status_code=404, content={"detail": "Resource not found by SPA handler, expected other handler."})

    react_app_index = "analytics-dashboard/build/index.html"
    if os.path.exists(react_app_index):
        print(f"SPA HANDLER: Serving React index.html for path: {full_path}")
        return FileResponse(react_app_index)
    else:
        print(f"SPA HANDLER: React index.html NOT FOUND at {react_app_index}")
        return JSONResponse(status_code=503, content={"detail": "React application not found (index.html missing)."})

def get_device_type(user_agent: str) -> str:
    ua = user_agent.lower()
    if any(x in ua for x in ["mobile", "android", "iphone", "ipad"]):
        return "mobile"
    return "desktop"

@app.get("/{code}")
async def redirect_to_url(code: str, request: Request):
    res = await get_url(code)
    if res:
        url, url_id = res
        # Analytics
        referrer = request.headers.get("referer", "")
        user_agent = request.headers.get("user-agent", "")
        ip_address = request.client.host if request.client else ""
        device_type = get_device_type(user_agent)
        from database import insert_click_event
        await insert_click_event(url_id, referrer, user_agent, ip_address, device_type)
        await increment_clicks(code)
        return RedirectResponse(url)
    raise HTTPException(status_code=404, detail="URL not found")

@app.get("/analytics/{code}")
async def analytics(code: str, limit: int = 100, offset: int = 0):
    from database import get_click_events
    events = await get_click_events(code, limit=limit, offset=offset)
    return {"events": events, "count": len(events)}

@app.get("/stats/{code}")
async def stats(code: str):
    data = await get_stats(code)
    if not data:
        raise HTTPException(status_code=404, detail="Short code not found")
    return data

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
