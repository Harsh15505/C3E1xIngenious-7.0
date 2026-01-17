"""Audit logging middleware for request-level transparency."""
import asyncio
import time
from typing import Any, Dict, Optional

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.models import SystemAuditLog, User
from app.modules.auth.utils import decode_token


class AuditLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.perf_counter()

        # Default context
        user_id: Optional[str] = None
        user_email: Optional[str] = None
        user_role: Optional[str] = None
        city_id: Optional[str] = None
        error_message: Optional[str] = None

        # Best-effort city extraction
        try:
            city_id = request.path_params.get("city")  # type: ignore[arg-type]
        except Exception:
            city_id = None
        if not city_id:
            city_id = request.query_params.get("city")

        # Best-effort user extraction from JWT
        auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
            try:
                payload = decode_token(token)
                user_id = str(payload.get("sub")) if payload.get("sub") else None
                user_email = payload.get("email")
                user_role = payload.get("role")
            except Exception:
                # If token invalid, continue without user context
                pass

        status_code = 500
        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as exc:
            error_message = str(exc)
            status_code = 500
            raise
        finally:
            # Fire-and-forget audit log (don't block response)
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            success = status_code < 500
            client_ip = request.client.host if request.client else None

            details: Dict[str, Any] = {
                "query": dict(request.query_params),
            }

            # Create background task for audit logging
            asyncio.create_task(
                self._log_audit(
                    method=request.method,
                    path=str(request.url.path),
                    status_code=status_code,
                    latency_ms=latency_ms,
                    client_ip=client_ip,
                    user_id=user_id,
                    user_email=user_email,
                    user_role=user_role,
                    city_id=city_id,
                    details=details,
                    success=success,
                    error_message=error_message,
                )
            )
        
        return response
    
    async def _log_audit(
        self,
        method: str,
        path: str,
        status_code: int,
        latency_ms: float,
        client_ip: Optional[str],
        user_id: Optional[str],
        user_email: Optional[str],
        user_role: Optional[str],
        city_id: Optional[str],
        details: Dict[str, Any],
        success: bool,
        error_message: Optional[str],
    ) -> None:
        """Background task to log audit entry"""
        try:
            await SystemAuditLog.create(
                method=method,
                path=path,
                status_code=status_code,
                latency_ms=latency_ms,
                client_ip=client_ip,
                user_id=user_id,
                user_email=user_email,
                user_role=user_role,
                category="http_request",
                action=path,
                city_id=city_id,
                details=details,
                success=success,
                error_message=error_message,
            )
        except Exception:
            # Silently fail - don't break app if audit logging fails
            pass
