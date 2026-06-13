from fastapi import HTTPException, status


def api_error(status_code: int, message: str, code: str | None = None) -> HTTPException:
    """Return a consistent API error payload."""

    detail: dict[str, str] = {"message": message}
    if code:
        detail["code"] = code
    return HTTPException(status_code=status_code, detail=detail)


def not_found(resource: str) -> HTTPException:
    return api_error(status.HTTP_404_NOT_FOUND, f"{resource} not found.", "not_found")


def forbidden(message: str = "You do not have permission to perform this action.") -> HTTPException:
    return api_error(status.HTTP_403_FORBIDDEN, message, "forbidden")
