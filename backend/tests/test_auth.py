def test_signup_creates_user_and_returns_token(client):
    r = client.post("/auth/signup", json={"username": "newuser", "password": "Str0ng!Pass"})
    assert r.status_code == 201
    data = r.json()
    assert data["access_token"]
    assert data["user"]["username"] == "newuser"
    assert data["user"]["email"] is None
    assert data["user"]["name"] is None


def test_signup_duplicate_username(client):
    client.post("/auth/signup", json={"username": "dupuser", "password": "Str0ng!Pass"})
    r = client.post("/auth/signup", json={"username": "dupuser", "password": "Str0ng!Pass"})
    assert r.status_code == 409


def test_signup_duplicate_username_case_insensitive(client):
    client.post("/auth/signup", json={"username": "CaseUser", "password": "Str0ng!Pass"})
    r = client.post("/auth/signup", json={"username": "caseuser", "password": "Str0ng!Pass"})
    assert r.status_code == 409


def test_signup_username_too_short_rejected(client):
    r = client.post("/auth/signup", json={"username": "ab", "password": "Str0ng!Pass"})
    assert r.status_code == 422


def test_signup_username_exactly_three_chars_accepted(client):
    r = client.post("/auth/signup", json={"username": "abc", "password": "Str0ng!Pass"})
    assert r.status_code == 201


def test_signup_arbitrary_non_email_username_accepted(client):
    r = client.post("/auth/signup", json={"username": "cool_user 42", "password": "Str0ng!Pass"})
    assert r.status_code == 201
    assert r.json()["user"]["username"] == "cool_user 42"


def test_signup_weak_password_missing_uppercase(client):
    r = client.post("/auth/signup", json={"username": "userA", "password": "weak!pass1"})
    assert r.status_code == 422


def test_signup_weak_password_missing_special_char(client):
    r = client.post("/auth/signup", json={"username": "userB", "password": "WeakPass1"})
    assert r.status_code == 422


def test_signup_weak_password_too_short(client):
    r = client.post("/auth/signup", json={"username": "userC", "password": "W1!a"})
    assert r.status_code == 422


def test_login_success(client):
    client.post("/auth/signup", json={"username": "loginuser", "password": "Str0ng!Pass"})
    r = client.post("/auth/login", json={"username": "loginuser", "password": "Str0ng!Pass"})
    assert r.status_code == 200
    assert r.json()["access_token"]


def test_login_case_insensitive_username(client):
    client.post("/auth/signup", json={"username": "LoginUser2", "password": "Str0ng!Pass"})
    r = client.post("/auth/login", json={"username": "loginuser2", "password": "Str0ng!Pass"})
    assert r.status_code == 200


def test_login_wrong_password(client):
    client.post("/auth/signup", json={"username": "loginuser3", "password": "Str0ng!Pass"})
    r = client.post("/auth/login", json={"username": "loginuser3", "password": "WrongPass1!"})
    assert r.status_code == 401


def test_login_nonexistent_username(client):
    r = client.post("/auth/login", json={"username": "ghostuser", "password": "Str0ng!Pass"})
    assert r.status_code == 401


def test_me_without_token(client):
    r = client.get("/auth/me")
    assert r.status_code == 403


def test_me_with_garbage_token(client):
    r = client.get("/auth/me", headers={"Authorization": "Bearer not-a-real-jwt"})
    assert r.status_code == 401


def test_me_returns_current_user(client, auth_headers, signup_user):
    r = client.get("/auth/me", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["username"] == signup_user["user"]["username"]


def test_update_profile_sets_name_email_and_bio(client, auth_headers):
    r = client.patch(
        "/auth/me",
        json={"name": "Alex", "email": "alex@example.com", "bio": "Building things."},
        headers=auth_headers,
    )
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "Alex"
    assert data["email"] == "alex@example.com"
    assert data["bio"] == "Building things."

    followup = client.get("/auth/me", headers=auth_headers)
    assert followup.json()["name"] == "Alex"


def test_update_profile_blank_name_rejected(client, auth_headers):
    r = client.patch(
        "/auth/me", json={"name": "   ", "email": "alex@example.com"}, headers=auth_headers
    )
    assert r.status_code == 422


def test_update_profile_missing_email_rejected(client, auth_headers):
    r = client.patch("/auth/me", json={"name": "Alex"}, headers=auth_headers)
    assert r.status_code == 422


def test_update_profile_malformed_email_rejected(client, auth_headers):
    r = client.patch(
        "/auth/me", json={"name": "Alex", "email": "not-an-email"}, headers=auth_headers
    )
    assert r.status_code == 422


def test_update_profile_duplicate_email_rejected(client, auth_headers):
    from tests.conftest import signup_and_get_token

    other = signup_and_get_token(client, username="otherprofileuser")
    other_headers = {"Authorization": f"Bearer {other['access_token']}"}
    client.patch(
        "/auth/me", json={"name": "First", "email": "shared@example.com"}, headers=other_headers
    )

    r = client.patch(
        "/auth/me", json={"name": "Second", "email": "shared@example.com"}, headers=auth_headers
    )
    assert r.status_code == 409


def test_update_profile_requires_token(client):
    r = client.patch("/auth/me", json={"name": "Alex", "email": "alex@example.com"})
    assert r.status_code == 403
