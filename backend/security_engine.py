import re
from pathlib import PurePosixPath
from urllib.parse import urlparse
from typing import Any


# Configure these for your real application before production use.
PROTECTED_FILES = {
    ".env", ".env.local", ".env.production", ".env.development",
    "id_rsa", "id_ed25519", "credentials.json", "secrets.json",
    "private.key", "id_ecdsa", ".npmrc",
}

# Replace with the real approved destinations for your application.
ALLOWED_DESTINATIONS = {"example.com"}

ALLOWED_ACTIONS = {"read_file", "list_files"}
SUPPORTED_ACTIONS = ALLOWED_ACTIONS | {"delete_file", "send_data"}

THREAT_PATTERNS = {
    "prompt_injection": [
        r"\bignore\s+(all\s+)?previous\s+instructions\b",
        r"\bignore\s+(all\s+)?prior\s+instructions\b",
        r"\bdisregard\s+(all\s+)?(previous|prior)\s+instructions\b",
        r"\b(reveal|print|show|expose)\s+(me\s+)?(your\s+)?(system|developer)\s+prompt\b",
        r"\b(bypass|disable|turn\s+off)\s+(the\s+)?(security|safety|guardrails?)\b",
        r"\bignore\s+(all\s+)?(safety\s+rules|guardrails?)\b",
        r"\bact\s+as\s+(an?\s+)?unrestricted\b",
        r"\bdo\s+anything\s+now\b",
    ],
    "sql_injection": [
        r"""'\s*(?:or|and)\s+['"]?\w+['"]?\s*=\s*['"]?\w+""",
        r"""(?:'|")\s*(?:or|and)\s+1\s*=\s*1\b""",
        r"\bunion\s+(?:all\s+)?select\b",
        r";\s*drop\s+table\b",
        r"\b(?:information_schema|sys\.objects)\b",
        r"\bwaitfor\s+delay\b",
        r"\bpg_sleep\s*\(",
        r"\bexec(?:ute)?\s*\(",
    ],
    "command_injection": [
        r"(?:^|\s)(?:;|&&|\|\|)\s*(?:rm|del|format|shutdown|curl|wget|powershell|bash)\b",
        r"\b(?:rm\s+-rf|del\s+/[sq]|format\s+[a-z]:)",
        r"\b(?:curl|wget)\b.{0,160}\|\s*(?:sh|bash)\b",
        r"\bsubprocess\.(?:Popen|run|call)\b",
        r"\bos\.system\s*\(",
        r"\beval\s*\(",
        r"\bexec\s*\(",
    ],
    "sensitive_data": [
        r"-----BEGIN\s+(?:RSA\s+|EC\s+|OPENSSH\s+)?PRIVATE KEY-----",
        r"\b(?:api[_-]?key|access[_-]?token|client[_-]?secret)\s*[:=]\s*['\"]?[\w./+=-]{8,}",
        r"\bpassword\s*[:=]\s*['\"]?[^,\s'\"]{4,}",
        r"\bsecret[_-]?key\s*[:=]\s*['\"]?[\w./+=-]{8,}",
        r"\b(?:sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,})\b",
    ],
    "suspicious_file_access": [
        r"(?:^|[/\\])\.\.(?:[/\\]|$)",
        r"(?:^|[/\\])etc[/\\]passwd(?:$|[/\\])",
        r"(?:^|[/\\])\.env(?:\.[^/\\]*)?(?:$|[/\\])",
        r"(?:^|[/\\])(?:id_rsa|id_ed25519|private\.key)(?:$|[/\\])",
        r"(?:^|[/\\])(?:secrets?\.json|credentials\.json)(?:$|[/\\])",
    ],
}

SEVERITY_WEIGHTS = {
    "prompt_injection": 35,
    "sql_injection": 50,
    "command_injection": 50,
    "sensitive_data": 45,
    "suspicious_file_access": 40,
}


def _result(score: int, level: str, decision: str, findings: list[dict], message: str) -> dict:
    return {
        "risk_score": max(0, min(100, int(score))),
        "risk_level": level,
        "decision": decision,
        "findings": findings,
        "message": message,
    }


def analyze_input(text: str) -> dict:
    """Heuristic detection for untrusted text; not a complete security solution."""
    if not isinstance(text, str):
        return _result(0, "low", "BLOCK", [], "Input must be a string.")
    if not text.strip():
        return _result(0, "low", "BLOCK", [], "Input cannot be empty.")

    normalized = text[:10000]
    findings = []

    for threat_type, patterns in THREAT_PATTERNS.items():
        for pattern in patterns:
            try:
                if re.search(pattern, normalized, re.IGNORECASE):
                    findings.append({
                        "type": threat_type,
                        "severity": "high",
                    })
                    break
            except re.error:
                # A broken detector must not crash the API. Tests should catch this.
                continue

    score = min(100, sum(SEVERITY_WEIGHTS[item["type"]] for item in findings))
    if score >= 70:
        level, decision = "critical", "BLOCK"
    elif score >= 40:
        level, decision = "high", "BLOCK"
    elif score > 0:
        level, decision = "medium", "REQUIRE_APPROVAL"
    else:
        level, decision = "low", "ALLOW"

    message = "Suspicious patterns detected." if findings else "No known suspicious patterns detected."
    return _result(score, level, decision, findings, message)


def check_action(action: Any, resource: Any = "", destination: Any = "", payload: Any = "") -> dict:
    """Evaluate an action against policy. This function does not execute the action."""
    def deny(reason: str, policy_id: str) -> dict:
        return {"decision": "BLOCK", "reason": reason, "policy_id": policy_id}

    if not isinstance(action, str):
        return deny("Action must be a string.", "POL-001")
    if not isinstance(resource, str):
        return deny("Resource must be a string.", "POL-001")
    if not isinstance(destination, str):
        return deny("Destination must be a string.", "POL-004")
    if not isinstance(payload, str):
        return deny("Payload must be a string.", "POL-005")

    action = action.strip().lower()
    resource = resource.strip().replace("\\", "/")
    destination = destination.strip()

    if action not in SUPPORTED_ACTIONS:
        return deny("Unknown or unsupported action.", "POL-001")

    if resource:
        # Check normalized path components, not just the final filename.
        path = PurePosixPath(resource)
        filename = path.name.lower()
        if filename in PROTECTED_FILES or filename.startswith(".env"):
            return deny("Access to a protected file is prohibited.", "POL-002")
        if ".." in path.parts:
            return deny("Path traversal is not permitted.", "POL-006")
        if re.search(r"(^|/)(?:etc/passwd|proc/self|\.ssh)(?:/|$)", resource.lower()):
            return deny("Access to a sensitive system path is prohibited.", "POL-002")

    if action == "delete_file":
        return {
            "decision": "REQUIRE_APPROVAL",
            "reason": "File deletion requires explicit approval.",
            "policy_id": "POL-003",
        }

    if action == "send_data":
        if not destination:
            return deny("No destination was provided.", "POL-004")
        try:
            parsed = urlparse(destination)
            hostname = parsed.hostname
            port = parsed.port
        except ValueError:
            return deny("Destination URL is malformed.", "POL-004")

        if (
            parsed.scheme.lower() != "https"
            or not hostname
            or parsed.username
            or parsed.password
            or port not in (None, 443)
        ):
            return deny("Only valid HTTPS destinations on the standard HTTPS port are accepted.", "POL-004")

        hostname = hostname.lower().rstrip(".")
        if hostname not in ALLOWED_DESTINATIONS:
            return deny("Destination is not allowlisted.", "POL-004")

        payload_analysis = analyze_input(payload) if payload else None
        sensitive_markers = (
            "password", "api_key", "api-key", "secret", "private_key",
            "private-key", "access_token", "client_secret",
        )
        if any(marker in payload.lower() for marker in sensitive_markers):
            return deny("Payload contains a sensitive-data indicator.", "POL-005")
        if payload_analysis and any(
            item["type"] == "sensitive_data" for item in payload_analysis["findings"]
        ):
            return deny("Payload appears to contain sensitive data.", "POL-005")

    return {
        "decision": "ALLOW",
        "reason": "Action passed the initial policy checks.",
        "policy_id": "POL-000",
    }
