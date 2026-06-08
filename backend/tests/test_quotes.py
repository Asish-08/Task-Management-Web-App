from app.models import Quote
from app.database import get_db
from app.main import app
from tests.conftest import TestingSessionLocal


def _seed(quotes):
    db = TestingSessionLocal()
    try:
        for q in quotes:
            db.add(Quote(**q))
        db.commit()
    finally:
        db.close()


def test_quote_fallback_when_no_quotes(client):
    r = client.get("/quotes")
    assert r.status_code == 200
    assert r.json()["text"] == "Keep going!"


def test_quote_returns_one_of_seeded_quotes(client):
    _seed([
        {"text": "Stay focused.", "author": "Unknown"},
        {"text": "Keep shipping.", "author": "Builder"},
    ])
    r = client.get("/quotes")
    assert r.status_code == 200
    data = r.json()
    assert data["text"] in ("Stay focused.", "Keep shipping.")
    assert "author" in data


def test_quote_has_text_field(client):
    _seed([{"text": "Do the work.", "author": None}])
    r = client.get("/quotes")
    assert r.status_code == 200
    assert r.json()["text"] == "Do the work."
