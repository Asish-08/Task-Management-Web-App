import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

SQLALCHEMY_TEST_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    # Each request gets its own session — sessions are not thread-safe.
    # StaticPool keeps one connection, so committed data is visible across sessions.
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def signup_and_get_token(client, username="testuser", password="Str0ng!Pass"):
    r = client.post("/auth/signup", json={"username": username, "password": password})
    return r.json()


@pytest.fixture
def signup_user(client):
    return signup_and_get_token(client)


@pytest.fixture
def auth_headers(signup_user):
    return {"Authorization": f"Bearer {signup_user['access_token']}"}
