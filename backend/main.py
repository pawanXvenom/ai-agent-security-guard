import os
import sqlite3
import jwt

from datetime import datetime, timedelta, timezone
from contextlib import asynccontextmanager
from typing import Literal, Annotated

from fastapi import (
    FastAPI,
    Query,
    HTTPException,
    Depends,
    Header,
)

import hashlib
import secrets


from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, EmailStr
from pwdlib import PasswordHash

from security_engine import check_action, analyze_input
from file_guard import guarded_read_file, guarded_list_files
from audit_logger import log_event, get_recent_events, get_audit_stats
from database import initialize_database, get_connection

from approval_manager import (
    create_approval_request,
    get_approval_requests,
    decide_approval_request,
)


# --------------------------------------------------
# AUTHENTICATION CONFIGURATION
# --------------------------------------------------

# Local development ke liye fallback.
# Production mein AGENTGUARD_JWT_SECRET environment variable set karna.
JWT_SECRET_KEY = os.getenv(
    "AGENTGUARD_JWT_SECRET",
    "local-development-only-change-this-secret",
)

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

password_hash = PasswordHash.recommended()
bearer_scheme = HTTPBearer(auto_error=False)


# --------------------------------------------------
# APPLICATION STARTUP
# --------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    yield


app = FastAPI(
    title="AgentGuard Security API",
    description="Rule-based security layer for AI agent actions",
    version="1.0.0",
    lifespan=lifespan,
)


# --------------------------------------------------
# CORS CONFIGURATION
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization","X-API-Key",
],
)


# --------------------------------------------------
# REQUEST MODELS
# --------------------------------------------------

class SignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ActionRequest(BaseModel):
    action: str = Field(min_length=1, max_length=50)
    resource: str = Field(default="", max_length=500)
    destination: str = Field(default="", max_length=500)
    payload: str = Field(default="", max_length=10000)


class AnalyzeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=10000)


class FileReadRequest(BaseModel):
    resource: str = Field(min_length=1, max_length=500)


class ApprovalDecisionRequest(BaseModel):
    decision: Literal["approve", "reject"]




class CreateAPIKeyRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    environment: Literal[
        "DEVELOPMENT",
        "STAGING",
        "PRODUCTION"
    ]


# --------------------------------------------------
# AUTHENTICATION HELPERS
# --------------------------------------------------

def create_access_token(user_id: int) -> str:
    """Generate a JWT access token for a user."""

    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],
):
    """Verify the JWT and return the active user."""

    unauthorized = HTTPException(
        status_code=401,
        detail="Invalid or expired authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise unauthorized

    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )

        subject = payload.get("sub")

        if not subject:
            raise unauthorized

        user_id = int(subject)

    except (jwt.PyJWTError, ValueError, TypeError):
        raise unauthorized

    with get_connection() as connection:
        user = connection.execute(
            """
            SELECT id, name, email, is_active, created_at
            FROM users
            WHERE id = ?
            """,
            (user_id,),
        ).fetchone()

    if user is None or user["is_active"] != 1:
        raise unauthorized

    return dict(user)



# --------------------------------------------------
# API KEY AUTHENTICATION
# --------------------------------------------------

def get_current_api_user(
    x_api_key: Annotated[
        str | None,
        Header(alias="X-API-Key"),
    ] = None,
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ] = None,
):
    """
    Authenticate requests using either:
    1. X-API-Key header for external integrations.
    2. Bearer JWT token for existing dashboard requests.
    """

    # External API key authentication
    if x_api_key:
        raw_key = x_api_key.strip()

        if not raw_key or len(raw_key) > 200:
            raise HTTPException(
                status_code=401,
                detail="Invalid or revoked API key.",
            )

        key_hash = hash_api_key(raw_key)

        with get_connection() as connection:
            row = connection.execute(
                """
                SELECT
                    api_keys.id AS api_key_id,
                    api_keys.user_id AS user_id,
                    api_keys.status AS key_status,
                    users.name AS name,
                    users.email AS email,
                    users.is_active AS is_active,
                    users.created_at AS created_at
                FROM api_keys
                JOIN users ON users.id = api_keys.user_id
                WHERE api_keys.key_hash = ?
                LIMIT 1
                """,
                (key_hash,),
            ).fetchone()

            if (
                row is None
                or row["key_status"] != "ACTIVE"
                or row["is_active"] != 1
            ):
                raise HTTPException(
                    status_code=401,
                    detail="Invalid or revoked API key.",
                )

            last_used_at = datetime.now(timezone.utc).isoformat()

            connection.execute(
                """
                UPDATE api_keys
                SET last_used_at = ?
                WHERE id = ?
                  AND status = 'ACTIVE'
                """,
                (last_used_at, row["api_key_id"]),
            )

        return {
            "id": row["user_id"],
            "name": row["name"],
            "email": row["email"],
            "is_active": row["is_active"],
            "created_at": row["created_at"],
            "auth_method": "api_key",
            "api_key_id": row["api_key_id"],
        }

    # Existing dashboard JWT authentication
    if credentials is not None:
        user = get_current_user(credentials)
        return {
            **user,
            "auth_method": "jwt",
            "api_key_id": None,
        }

    raise HTTPException(
        status_code=401,
        detail="Provide an X-API-Key header or a Bearer token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

# --------------------------------------------------
# HOME AND HEALTH
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "AgentGuard Security API is running",
        "status": "active",
        "version": "1.0.0",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "agent-security-guard",
    }


# --------------------------------------------------
# SIGNUP
# --------------------------------------------------

@app.post("/api/v1/auth/signup", status_code=201)
def signup(request: SignupRequest):
    name = request.name.strip()
    email = str(request.email).strip().lower()

    if not name:
        raise HTTPException(
            status_code=422,
            detail="Name is required.",
        )

    # Hash password before saving it.
    hashed_password = password_hash.hash(request.password)

    created_at = datetime.now(timezone.utc).isoformat()

    try:
        with get_connection() as connection:
            cursor = connection.execute(
                """
                INSERT INTO users (
                    name,
                    email,
                    password_hash,
                    is_active,
                    created_at
                )
                VALUES (?, ?, ?, 1, ?)
                """,
                (
                    name,
                    email,
                    hashed_password,
                    created_at,
                ),
            )

            user_id = cursor.lastrowid

    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        )

    access_token = create_access_token(user_id)

    return {
        "message": "Account created successfully.",
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": user_id,
            "name": name,
            "email": email,
            "created_at": created_at,
        },
    }


# --------------------------------------------------
# LOGIN
# --------------------------------------------------

@app.post("/api/v1/auth/login")
def login(request: LoginRequest):
    email = str(request.email).strip().lower()

    with get_connection() as connection:
        user = connection.execute(
            """
            SELECT id, name, email, password_hash,
                   is_active, created_at
            FROM users
            WHERE email = ?
            """,
            (email,),
        ).fetchone()

    # Same response for incorrect email/password.
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    if user["is_active"] != 1:
        raise HTTPException(
            status_code=403,
            detail="This account is disabled.",
        )

    try:
        password_is_valid = password_hash.verify(
            request.password,
            user["password_hash"],
        )
    except Exception:
        password_is_valid = False

    if not password_is_valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    access_token = create_access_token(user["id"])

    return {
        "message": "Login successful.",
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "created_at": user["created_at"],
        },
    }


# --------------------------------------------------
# CURRENT LOGGED-IN USER
# --------------------------------------------------

@app.get("/api/v1/auth/me")
def get_me(
    current_user: Annotated[dict, Depends(get_current_user)],
):
    return {
        "user": current_user,
    }


# --------------------------------------------------
# RULE-BASED THREAT ANALYSIS
# --------------------------------------------------

@app.post("/api/v1/analyze")
def analyze_threat(
    request: AnalyzeRequest,
    current_user: Annotated[
        dict,
        Depends(get_current_api_user),
    ],
):
    result = analyze_input(request.text)

    log_event(
        action="analyze_input",
        resource="",
        destination="",
        result={
            "decision": result["decision"],
            "reason": result.get(
                "message",
                "Threat analysis completed.",
            ),
            "policy_id": "THREAT-ANALYSIS-001",
        },
    )

    return result
# --------------------------------------------------
# ACTION SECURITY POLICY
# --------------------------------------------------

@app.post("/api/v1/check-action")
def check_agent_action(
    request: ActionRequest,
    current_user: Annotated[
        dict,
        Depends(get_current_api_user),
    ],
):
    result = check_action(
        action=request.action,
        resource=request.resource,
        destination=request.destination,
        payload=request.payload,
    )

    log_event(
        action=request.action,
        resource=request.resource,
        destination=request.destination,
        result=result,
    )

    if result.get("decision") == "REQUIRE_APPROVAL":
        approval_id = create_approval_request(
            action=request.action,
            resource=request.resource,
            destination=request.destination,
            result=result,
        )

        return {
            **result,
            "approval_id": approval_id,
            "approval_status": "PENDING",
            "message": (
                "Action requires approval before it can proceed."
            ),
        }

    return result

# --------------------------------------------------
# SANDBOX FILE LISTING
# --------------------------------------------------

@app.get("/api/v1/files")
def list_sandbox_files(
    current_user: Annotated[
        dict,
        Depends(get_current_api_user),
    ],
):
    result = guarded_list_files()

    log_event(
        action="list_files",
        resource="",
        destination="",
        result=result,
    )

    return result

# --------------------------------------------------
# SANDBOX FILE READING
# --------------------------------------------------

@app.post("/api/v1/files/read")
def read_sandbox_file(
    request: FileReadRequest,
    current_user: Annotated[
        dict,
        Depends(get_current_api_user),
    ],
):
    result = guarded_read_file(request.resource)

    log_event(
        action="read_file",
        resource=request.resource,
        destination="",
        result=result,
    )

    return result
# --------------------------------------------------
# AUDIT LOGS
# --------------------------------------------------

@app.get("/api/v1/audit-logs")
def audit_logs(
    limit: int = Query(default=50, ge=1, le=200),
):
    return {
        "events": get_recent_events(limit),
    }


@app.get("/api/v1/audit-logs/stats")
def audit_log_stats():
    return get_audit_stats()


# --------------------------------------------------
# APPROVAL REQUESTS
# --------------------------------------------------

@app.get("/api/v1/approvals")
def list_approvals(
    status: Literal["PENDING", "APPROVED", "REJECTED"] | None = None,
    limit: int = 50,
):
    limit = max(1, min(limit, 200))

    return {
        "requests": get_approval_requests(
            status=status,
            limit=limit,
        ),
    }


@app.post("/api/v1/approvals/{approval_id}/decision")
def submit_approval_decision(
    approval_id: int,
    request: ApprovalDecisionRequest,
):
    decision = (
        "APPROVED"
        if request.decision == "approve"
        else "REJECTED"
    )

    result = decide_approval_request(
        approval_id=approval_id,
        decision=decision,
    )

    if not result["success"]:
        if result["message"] == "Approval request not found.":
            raise HTTPException(
                status_code=404,
                detail=result["message"],
            )

        raise HTTPException(
            status_code=409,
            detail=result["message"],
        )

    log_event(
        action="approval_decision",
        resource=str(approval_id),
        destination="",
        result={
            "decision": decision,
            "reason": result["message"],
            "policy_id": "APPROVAL-001",
        },
    )

    return result


# --------------------------------------------------
# API KEY MANAGEMENT
# --------------------------------------------------

def hash_api_key(raw_key: str) -> str:
    """Hash an API key before storing it in the database."""
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


@app.get("/api/v1/api-keys")
def list_api_keys(
    current_user: Annotated[dict, Depends(get_current_user)],
):
    """Return API keys belonging only to the logged-in user."""

    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT
                id,
                name,
                key_prefix,
                environment,
                status,
                created_at,
                last_used_at,
                revoked_at
            FROM api_keys
            WHERE user_id = ?
            ORDER BY id DESC
            """,
            (current_user["id"],),
        ).fetchall()

    api_keys = []

    for row in rows:
        item = dict(row)

        # Never return the stored key hash or original secret.
        item["masked_key"] = f'{item["key_prefix"]}{"*" * 12}'
        api_keys.append(item)

    return {"api_keys": api_keys}


@app.post("/api/v1/api-keys", status_code=201)
def create_api_key(
    request: CreateAPIKeyRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
):
    """Generate a new API key for the logged-in user."""

    name = request.name.strip()

    if not name:
        raise HTTPException(
            status_code=422,
            detail="API key name is required.",
        )

    # Generate a cryptographically secure secret.
    raw_key = f"ag_{secrets.token_urlsafe(32)}"

    # Only the hash is stored in the database.
    key_hash = hash_api_key(raw_key)

    # A short prefix helps identify the key in the dashboard.
    key_prefix = raw_key[:11]

    created_at = datetime.now(timezone.utc).isoformat()

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO api_keys (
                user_id,
                name,
                key_prefix,
                key_hash,
                environment,
                status,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?)
            """,
            (
                current_user["id"],
                name,
                key_prefix,
                key_hash,
                request.environment,
                created_at,
            ),
        )

        key_id = cursor.lastrowid

    # Return the actual secret only once, at creation time.
    return {
        "message": "API key created successfully.",
        "api_key": {
            "id": key_id,
            "name": name,
            "key_prefix": key_prefix,
            "masked_key": f'{key_prefix}{"*" * 12}',
            "environment": request.environment,
            "status": "ACTIVE",
            "created_at": created_at,
        },
        "secret_key": raw_key,
        "warning": (
            "Copy this secret now. It cannot be retrieved again."
        ),
    }


@app.post("/api/v1/api-keys/{api_key_id}/revoke")
def revoke_api_key(
    api_key_id: int,
    current_user: Annotated[dict, Depends(get_current_user)],
):
    """Revoke a key only if it belongs to the logged-in user."""

    revoked_at = datetime.now(timezone.utc).isoformat()

    with get_connection() as connection:
        cursor = connection.execute(
            """
            UPDATE api_keys
            SET status = 'REVOKED',
                revoked_at = ?
            WHERE id = ?
              AND user_id = ?
              AND status = 'ACTIVE'
            """,
            (
                revoked_at,
                api_key_id,
                current_user["id"],
            ),
        )

        if cursor.rowcount == 0:
            # Do not reveal whether another user's key exists.
            raise HTTPException(
                status_code=404,
                detail="Active API key not found.",
            )

    return {
        "message": "API key revoked successfully.",
        "id": api_key_id,
        "status": "REVOKED",
        "revoked_at": revoked_at,
    }