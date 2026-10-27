from datetime import datetime, timezone

from database import get_connection


def log_event(
    action,
    resource,
    destination,
    result,
):
    """
    Save a security decision to the audit database.
    Never store the actual request payload here.
    """

    timestamp = datetime.now(timezone.utc).isoformat()

    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO audit_logs (
                action,
                resource,
                destination,
                decision,
                reason,
                policy_id,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                action,
                resource,
                destination,
                result.get("decision", "BLOCK"),
                result.get("reason", "No reason provided"),
                result.get("policy_id", "UNKNOWN"),
                timestamp,
            ),
        )

        connection.commit()


def get_recent_events(limit=50):
    """
    Return the latest audit events.
    """

    limit = max(1, min(int(limit), 200))

    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT
                id,
                action,
                resource,
                destination,
                decision,
                reason,
                policy_id,
                created_at
            FROM audit_logs
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

    return [dict(row) for row in rows]


def get_audit_stats():
    """
    Return counts of recorded security decisions.
    """

    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT decision, COUNT(*) AS total
            FROM audit_logs
            GROUP BY decision
            """
        ).fetchall()

    stats = {
        "total": 0,
        "allowed": 0,
        "blocked": 0,
        "pending_approval": 0,
    }

    for row in rows:
        decision = row["decision"]
        count = row["total"]

        stats["total"] += count

        if decision == "ALLOW":
            stats["allowed"] += count
        elif decision == "BLOCK":
            stats["blocked"] += count
        elif decision == "REQUIRE_APPROVAL":
            stats["pending_approval"] += count

    return stats