from app.services.auth import hash_password, verify_password


def test_password_hash_round_trip() -> None:
    password_hash = hash_password("correct horse battery staple")

    assert verify_password("correct horse battery staple", password_hash)
    assert not verify_password("wrong password", password_hash)
