from pathlib import Path

from security_engine import check_action


# Only this directory is approved for file access.
SANDBOX_DIR = (Path(__file__).parent / "sandbox").resolve()

# Prevent the demo from reading unexpectedly large files.
MAX_FILE_SIZE = 1 * 1024 * 1024  # 1 MB


def validate_sandbox_path(resource: str) -> Path:
    """
    Resolve a requested path and ensure it remains inside the sandbox.
    Reject empty paths, absolute paths, traversal attempts, and symlinks.
    """
    if not isinstance(resource, str) or not resource.strip():
        raise PermissionError("Access denied: a valid file path is required.")

    resource = resource.strip()

    # Do not accept absolute paths.
    requested = Path(resource)

    if requested.is_absolute():
        raise PermissionError("Access denied: absolute paths are not allowed.")

    # Reject explicit parent-directory traversal.
    if ".." in requested.parts:
        raise PermissionError("Access denied: path traversal detected.")

    # Walk through each path component and reject symlinks.
    current = SANDBOX_DIR

    for part in requested.parts:
        if part in ("", "."):
            continue

        current = current / part

        if current.is_symlink():
            raise PermissionError(
                "Access denied: symbolic links are not allowed."
            )

    # Resolve and verify the final path is inside the sandbox.
    resolved_path = current.resolve(strict=False)

    try:
        resolved_path.relative_to(SANDBOX_DIR)
    except ValueError:
        raise PermissionError(
            "Access denied: path is outside the approved sandbox."
        )

    return resolved_path


def guarded_read_file(resource: str) -> dict:
    """
    Apply security policies before reading a sandbox file.
    Return file content only when all checks pass.
    """
    try:
        # 1. Validate the path before accessing the file.
        file_path = validate_sandbox_path(resource)

        # 2. Apply the existing AgentGuard security policy.
        policy_result = check_action(
            action="read_file",
            resource=resource,
        )

        if policy_result.get("decision") != "ALLOW":
            return policy_result

        # 3. Require an existing regular file.
        if not file_path.is_file():
            return {
                "decision": "BLOCK",
                "reason": "The requested file does not exist or is not a regular file.",
                "policy_id": "FILE-001",
            }

        # 4. Reject oversized files.
        if file_path.stat().st_size > MAX_FILE_SIZE:
            return {
                "decision": "BLOCK",
                "reason": "File exceeds the maximum permitted size of 1 MB.",
                "policy_id": "FILE-005",
            }

        # 5. Read the file only after validation.
        content = file_path.read_text(encoding="utf-8")

        return {
            "decision": "ALLOW",
            "reason": "File access passed the security checks.",
            "resource": resource,
            "content": content,
            "policy_id": "FILE-000",
        }

    except (PermissionError, OSError, ValueError, RuntimeError) as error:
        return {
            "decision": "BLOCK",
            "reason": str(error) or "File access was denied.",
            "policy_id": "FILE-002",
        }


def guarded_list_files() -> dict:
    """
    List regular files directly inside the sandbox.
    Do not follow symbolic links or expose files outside the sandbox.
    """
    try:
        files = []

        # Reject a missing or invalid sandbox directory.
        if SANDBOX_DIR.is_symlink() or not SANDBOX_DIR.is_dir():
            return {
                "decision": "BLOCK",
                "reason": "The approved sandbox directory is unavailable.",
                "policy_id": "FILE-004",
            }

        for path in SANDBOX_DIR.iterdir():
            # Do not expose symlinks or follow them.
            if path.is_symlink():
                continue

            if path.is_file():
                files.append(path.name)

        return {
            "decision": "ALLOW",
            "reason": "Sandbox file listing completed.",
            "files": sorted(files),
            "policy_id": "FILE-003",
        }

    except OSError:
        return {
            "decision": "BLOCK",
            "reason": "Unable to list sandbox files.",
            "policy_id": "FILE-004",
        }
