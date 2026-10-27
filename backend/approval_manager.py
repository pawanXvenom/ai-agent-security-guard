from datetime import datetime, timezone

from database import get_connection


def create_approval_request(action, resource, destination, result):
    """Create a pending approval request without storing payload data."""

    timestamp = datetime.now(timezone.utc).isoformat()

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO approval_requests (
                action,
                resource,
                destination,
                reason,
                policy_id,
                status,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, 'PENDING', ?)
            """,
            (
                action,
                resource,
                destination,
                result.get("reason", "Approval required."),
                result.get("policy_id", "APPROVAL-001"),
                timestamp,
            ),
        )

        connection.commit()
        return cursor.lastrowid


def get_approval_requests(status=None, limit=50):
    """Return recent approval requests, optionally filtered by status."""

    limit = max(1, min(int(limit), 200))

    with get_connection() as connection:
        if status:
            rows = connection.execute(
                """
                SELECT *
                FROM approval_requests
                WHERE status = ?
                ORDER BY id DESC
                LIMIT ?
                """,
                (status, limit),
            ).fetchall()
        else:
            rows = connection.execute(
                """
                SELECT *
                FROM approval_requests
                ORDER BY id DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()

    return [dict(row) for row in rows]


def decide_approval_request(approval_id, decision):
    """Approve or reject a pending request exactly once."""

    if decision not in ("APPROVED", "REJECTED"):
        return {
            "success": False,
            "message": "Invalid decision.",
        }

    timestamp = datetime.now(timezone.utc).isoformat()

    with get_connection() as connection:
        cursor = connection.execute(
            """
            UPDATE approval_requests
            SET status = ?, decided_at = ?
            WHERE id = ? AND status = 'PENDING'
            """,
            (decision, timestamp, approval_id),
        )

        connection.commit()

        if cursor.rowcount == 0:
            existing = connection.execute(
                """
                SELECT status
                FROM approval_requests
                WHERE id = ?
                """,
                (approval_id,),
            ).fetchone()

            if existing is None:
                return {
                    "success": False,
                    "message": "Approval request not found.",
                }

            return {
                "success": False,
                "message": (
                    "This request has already been decided."
                    if existing["status"] != "PENDING"
                    else "Unable to update the request."
                ),
            }

    return {
        "success": True,
        "approval_id": approval_id,
        "status": decision,
        "message": f"Request {decision.lower()} successfully.",
    }