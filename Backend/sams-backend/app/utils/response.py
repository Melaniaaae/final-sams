from typing import Any, Optional
from fastapi.responses import JSONResponse


def success_response(data: Any, message: str = "Success", status_code: int = 200) -> dict:
    """Wrap any data in the standard SAMS API envelope."""
    return {"data": data, "message": message, "success": True}


def paginated_response(
    items: list,
    total: int,
    page: int,
    page_size: int,
    message: str = "Success",
) -> dict:
    """Standard paginated envelope matching Angular PaginatedResponse<T>."""
    return {
        "data": {
            "items": items,
            "total": total,
            "page": page,
            "pageSize": page_size,
        },
        "message": message,
        "success": True,
    }


def error_response(detail: str, status_code: int = 400) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"detail": detail, "success": False},
    )
