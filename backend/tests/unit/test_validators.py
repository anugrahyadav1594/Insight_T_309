"""Unit tests for Pydantic schema validation (§24.2)."""

from __future__ import annotations

from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.schemas.auth import LoginRequest, RegisterRequest
from app.schemas.portfolio import HoldingCreate, HoldingUpdate
from app.schemas.screener import ScreenerFilter, ScreenerRequest
from app.schemas.ai import ChatRequest


def test_screener_filter_rejects_unknown_field():
    with pytest.raises(ValidationError):
        ScreenerFilter(**{"sector": "Technology", "evil": "payload"})


def test_screener_filter_rejects_min_gt_max():
    with pytest.raises(ValidationError):
        ScreenerFilter(**{"roe_min": 90, "roe_max": 10})


def test_screener_filter_rejects_score_out_of_range():
    with pytest.raises(ValidationError):
        ScreenerFilter(**{"overall_score_min": Decimal("150")})


def test_screener_filter_accepts_valid():
    f = ScreenerFilter(**{"sector": "Technology", "roe_min": 20, "debt_to_equity_max": 0.5})
    assert f.sector == "Technology"
    assert f.roe_min == Decimal("20")


def test_screener_request_rejects_bad_limit():
    with pytest.raises(ValidationError):
        ScreenerRequest(**{"limit": 9999})


def test_screener_request_rejects_bad_sort():
    with pytest.raises(ValidationError):
        ScreenerRequest(**{"sort_by": "unknown_field"})


def test_chat_request_rejects_extra_fields():
    with pytest.raises(ValidationError):
        ChatRequest(**{"message": "hi", "context": {}, "hack": True})


def test_register_rejects_weak_password():
    with pytest.raises(ValidationError):
        RegisterRequest(email="a@b.com", password="short", full_name="A B")


def test_register_rejects_password_without_digit():
    with pytest.raises(ValidationError):
        RegisterRequest(email="a@b.com", password="abcdefgh", full_name="A B")


def test_login_valid():
    lr = LoginRequest(email="a@b.com", password="anything1")
    assert lr.email == "a@b.com"


def test_holding_create_rejects_nonpositive():
    with pytest.raises(ValidationError):
        HoldingCreate(ticker="TCS", quantity=Decimal("0"), average_buy_price=Decimal("100"))
    with pytest.raises(ValidationError):
        HoldingCreate(ticker="TCS", quantity=Decimal("10"), average_buy_price=Decimal("0"))


def test_holding_update_requires_at_least_one_field():
    hu = HoldingUpdate(quantity=Decimal("5"))
    assert hu.has_changes()
    hu2 = HoldingUpdate()
    assert not hu2.has_changes()