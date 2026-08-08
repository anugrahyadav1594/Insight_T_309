"""Pydantic DTOs for authentication (§5)."""

from __future__ import annotations

import re
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

_PASSWORD_RE = re.compile(r"^(?=.*[A-Za-z])(?=.*\d).+$")


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=120)

    model_config = ConfigDict(extra="forbid")

    @field_validator("password")
    @classmethod
    def _password_strength(cls, v: str) -> str:
        if not _PASSWORD_RE.match(v):
            raise ValueError("password must contain at least one letter and one digit")
        return v

    @field_validator("full_name")
    @classmethod
    def _strip_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("full_name must not be empty")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    model_config = ConfigDict(extra="forbid")


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1, max_length=256)

    model_config = ConfigDict(extra="forbid")


class LogoutRequest(BaseModel):
    refresh_token: str = Field(min_length=1, max_length=256)

    model_config = ConfigDict(extra="forbid")


class UserOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut | None = None

    model_config = ConfigDict(extra="forbid")


class TokenRefreshResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

    model_config = ConfigDict(extra="forbid")


class MeResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)