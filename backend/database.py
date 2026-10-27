
import sqlite3
from pathlib import Path


# Existing database location — do not change.
BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "agent_guard.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database():
    with get_connection() as connection:

        # Existing audit logs table — preserved.
        connection.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT NOT NULL,
                resource TEXT,
                destination TEXT,
                decision TEXT NOT NULL,
                reason TEXT NOT NULL,
                policy_id TEXT,
                created_at TEXT NOT NULL
            )
        """)

        # Existing approval requests table — preserved.
        connection.execute("""
            CREATE TABLE IF NOT EXISTS approval_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT NOT NULL,
                resource TEXT,
                destination TEXT,
                reason TEXT NOT NULL,
                policy_id TEXT,
                status TEXT NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
                created_at TEXT NOT NULL,
                decided_at TEXT
            )
        """)

        # New users table for AgentGuard signup/login.
        connection.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL COLLATE NOCASE UNIQUE,
                password_hash TEXT NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 1
                    CHECK (is_active IN (0, 1)),
                created_at TEXT NOT NULL
            )
        """)

                # API keys table — each key belongs to one user.
        connection.execute("""
            CREATE TABLE IF NOT EXISTS api_keys (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                key_prefix TEXT NOT NULL,
                key_hash TEXT NOT NULL UNIQUE,
                environment TEXT NOT NULL
                    CHECK (
                        environment IN (
                            'DEVELOPMENT',
                            'STAGING',
                            'PRODUCTION'
                        )
                    ),
                status TEXT NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE', 'REVOKED')),
                created_at TEXT NOT NULL,
                last_used_at TEXT,
                revoked_at TEXT,
                FOREIGN KEY (user_id)
                    REFERENCES users(id)
                    ON DELETE CASCADE
            )
        """)

        connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_api_keys_user_id
            ON api_keys(user_id)
        """)


        connection.commit()


if __name__ == "__main__":
    initialize_database()
    print("AgentGuard database initialized successfully.")
    print(f"Database location: {DATABASE_PATH}")
