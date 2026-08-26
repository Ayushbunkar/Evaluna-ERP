
from __future__ import annotations

import json
import os
import re
import subprocess
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any

from openai import OpenAI


# ============================================================
# CONFIGURATION
# ============================================================

PROJECT_DIR = Path(
    os.getenv("EVALUNA_PROJECT_DIR", r"D:\Evaluna ERP")
).resolve()

OUTPUT_DIR = PROJECT_DIR / "nemotron_audits"

MODEL = os.getenv(
    "NEMOTRON_MODEL",
    "nvidia/nemotron-3-super-120b-a12b",
)

AUDIT_WORKERS = int(os.getenv("NEMOTRON_AUDIT_WORKERS", "6"))
IMPLEMENTATION_WORKERS = int(
    os.getenv("NEMOTRON_IMPLEMENTATION_WORKERS", "4")
)

MAX_CONTEXT_CHARS = int(
    os.getenv("NEMOTRON_MAX_CONTEXT_CHARS", "300000")
)

AUDIT_MAX_TOKENS = int(
    os.getenv("NEMOTRON_AUDIT_MAX_TOKENS", "7000")
)
AUDIT_REASONING_BUDGET = int(
    os.getenv("NEMOTRON_AUDIT_REASONING_BUDGET", "2048")
)

IMPLEMENT_MAX_TOKENS = int(
    os.getenv("NEMOTRON_IMPLEMENT_MAX_TOKENS", "9000")
)
IMPLEMENT_REASONING_BUDGET = int(
    os.getenv("NEMOTRON_IMPLEMENT_REASONING_BUDGET", "0")
)

REPAIR_MAX_TOKENS = int(
    os.getenv("NEMOTRON_REPAIR_MAX_TOKENS", "9000")
)
REPAIR_REASONING_BUDGET = int(
    os.getenv("NEMOTRON_REPAIR_REASONING_BUDGET", "0")
)

FINAL_MAX_TOKENS = int(
    os.getenv("NEMOTRON_FINAL_MAX_TOKENS", "8000")
)
FINAL_REASONING_BUDGET = int(
    os.getenv("NEMOTRON_FINAL_REASONING_BUDGET", "2048")
)

TEMPERATURE = float(
    os.getenv("NEMOTRON_TEMPERATURE", "0.15")
)

MAX_RETRIES = int(
    os.getenv("NEMOTRON_MAX_RETRIES", "4")
)
RETRY_BASE_SECONDS = float(
    os.getenv("NEMOTRON_RETRY_BASE_SECONDS", "2")
)

MAX_REPAIR_ROUNDS = int(
    os.getenv("NEMOTRON_MAX_REPAIR_ROUNDS", "5")
)

COMMAND_TIMEOUT_SECONDS = int(
    os.getenv("NEMOTRON_COMMAND_TIMEOUT", "1200")
)

MAX_FINDINGS_PER_BATCH = int(
    os.getenv("NEMOTRON_MAX_FINDINGS_PER_BATCH", "4")
)

TASK_END_MARKER = "END_TASK"

# Keep generated artifacts out of the scan.
IGNORE_DIRS = {
    ".git",
    "node_modules",
    ".next",
    "dist",
    "build",
    "coverage",
    ".turbo",
    ".cache",
    "__pycache__",
    ".venv",
    "venv",
    "nemotron_audits",
    ".idea",
    ".vscode",
}

ALLOWED_EXTENSIONS = {
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".py",
    ".sql",
    ".prisma",
    ".json",
}

# ============================================================
# WORKER DEFINITIONS
# ============================================================

WORKERS: dict[str, dict[str, Any]] = {
    "security": {
        "keywords": [
            "auth", "authentication", "authorization", "permission",
            "role", "rbac", "session", "token", "user", "admin",
            "middleware", "security", "tenant", "company", "branch",
        ],
        "instruction": """
Audit authentication, authorization and isolation.

Focus on:
- authentication
- authorization
- RBAC
- privilege escalation
- IDOR
- permission bypass
- tenant/company isolation
- branch isolation
- session security
- token handling
- secret exposure
- injection risks
- insecure uploads
- sensitive data exposure
- server-side authorization

Only report confirmed defects.
""",
        "owned_prefixes": [
            "apps/web/src/lib/auth",
            "apps/web/src/lib/trpc",
            "packages/auth",
            "packages/api/src",
        ],
    },
    "database_business": {
        "keywords": [
            "schema", "migration", "drizzle", "postgres", "database",
            "db", "sql", "transaction", "inventory", "stock", "product",
            "warehouse", "batch", "barcode", "upc", "account", "ledger",
            "invoice", "payment", "bill", "journal", "gst", "tax",
        ],
        "instruction": """
Audit database and ERP business logic.

Focus on:
- schema/migrations
- transactions
- constraints
- indexes
- foreign keys
- uniqueness
- concurrency
- race conditions
- data integrity
- inventory
- stock movements
- warehouses
- products
- batches
- barcode/UPC
- accounting
- invoices
- payments
- ledger
- GST/tax
- incorrect business rules

Only report confirmed defects.
""",
        "owned_prefixes": [
            "packages/db",
            "apps/web/src/lib/trpc/routers",
        ],
    },
    "sales_hr": {
        "keywords": [
            "sale", "sales", "order", "customer", "quotation", "discount",
            "price", "employee", "attendance", "leave", "shift", "payroll",
            "hr", "salary", "payslip",
        ],
        "instruction": """
Audit sales, orders, customers, HR and attendance.

Focus on:
- orders
- pricing
- discounts
- returns
- customers
- employees
- attendance
- leave
- shifts
- payroll
- salary
- duplicate actions
- incorrect totals
- invalid state transitions
- incorrect business rules

Only report confirmed defects.
""",
        "owned_prefixes": [
            "apps/web/src/lib/trpc/routers",
            "apps/web/src/app",
        ],
    },
    "backend_api": {
        "keywords": [
            "api", "route", "controller", "service", "trpc", "mutation",
            "query", "handler", "middleware", "repository", "server",
            "delivery", "payment", "notification",
        ],
        "instruction": """
Audit backend and API implementation.

Focus on:
- tRPC
- API route handlers
- controllers
- services
- validation
- authorization
- error handling
- async logic
- race conditions
- request/response correctness
- rate limiting
- API contract mismatches
- frontend/backend mismatches
- mock backend data
- incomplete procedures

Only report confirmed defects.
""",
        "owned_prefixes": [
            "apps/web/src/lib/trpc",
            "apps/web/src/app/api",
            "packages/api/src",
        ],
    },
    "dashboards_frontend": {
        "keywords": [
            "dashboard", "page", "layout", "route", "portal", "sidebar",
            "navigation", "workspace", "component", "form", "modal",
            "react", "next", "tsx", "jsx", "customer", "admin", "manager",
            "auditor", "employee",
        ],
        "instruction": """
Audit dashboard and frontend completeness.

Discover actual dashboard routes from the repository.

For each discovered dashboard verify:
- real page
- real data source
- backend procedure
- database/business logic
- authorization
- validation
- loading
- error
- empty
- real actions
- mock/static data
- TODO/placeholder functionality
- frontend/backend contracts

Only report confirmed defects.
""",
        "owned_prefixes": [
            "apps/web/src/app",
            "apps/web/src/components",
        ],
    },
    "performance_production": {
        "keywords": [
            "cache", "redis", "queue", "worker", "sync", "offline",
            "pwa", "performance", "logging", "monitor", "deployment",
            "docker", "vercel", "railway", "cron", "job",
        ],
        "instruction": """
Audit performance and production reliability.

Focus on:
- N+1 queries
- inefficient/unbounded queries
- repeated requests
- caching
- memory problems
- connection pools
- queues
- background jobs
- offline synchronization
- PWA
- logging
- monitoring
- deployment
- reliability
- scalability

Only report confirmed defects.
""",
        "owned_prefixes": [
            "apps/web",
            "packages",
            "docker",
            "infra",
        ],
    },
}


# ============================================================
# PROMPTS
# ============================================================

AUDIT_SYSTEM_PROMPT = r"""
You are a senior production ERP source-code auditor.

Inspect the supplied repository source carefully.

Do not invent issues.
Do not report hypothetical problems as confirmed defects.
Do not rely on comments alone when actual behavior is available.

Return JSON only:

{
  "findings": [
    {
      "id": "stable-id",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "file": "repo-relative/path",
      "function": "function/component",
      "problem": "precise defect",
      "evidence": "specific source evidence",
      "impact": "actual impact",
      "fix": "specific implementation fix",
      "confidence": "CONFIRMED"
    }
  ]
}

If no confirmed defects exist:
{"findings":[]}

No Markdown.
No prose outside JSON.
"""

IMPLEMENT_SYSTEM_PROMPT = r"""
You are a senior engineer directly modifying an existing repository.

Your task is to implement the confirmed fixes.

DO NOT write an audit.
DO NOT explain a plan.
DO NOT merely describe the fix.
DO NOT return JSON.
DO NOT use Markdown code fences.

Return only one or more exact change blocks:

===CHANGE===
PATH: repo/relative/path
SEARCH:
<exact existing text>
===REPLACE===
<exact replacement text>
===END_CHANGE===

Rules:
- PATH must remain inside the repository.
- SEARCH must exactly match existing source.
- SEARCH should normally match exactly once.
- REPLACE must be executable source code.
- Preserve architecture.
- Preserve security.
- Preserve existing valid behavior.
- Do not introduce mock data.
- Do not disable tests.
- Do not weaken validation or authorization.
- Do not invent schema or APIs without source evidence.
- Make minimal targeted changes.
- If no safe change can be produced, return no CHANGE block and one brief reason.
"""

REPAIR_SYSTEM_PROMPT = r"""
You are a senior debugging engineer directly modifying an existing repository.

Automated verification has failed after previous implementation changes.

Fix the actual failure.

Return ONLY exact change blocks:

===CHANGE===
PATH: repo/relative/path
SEARCH:
<exact existing text>
===REPLACE===
<exact replacement text>
===END_CHANGE===

Rules:
- Never disable tests.
- Never weaken authorization.
- Never replace real logic with mocks.
- Preserve the intended fix.
- Fix root cause.
- Make minimal changes.
"""

FINAL_SYSTEM_PROMPT = r"""
You are the final verification engineer.

Use only machine-backed evidence supplied to you.

Never claim a test passed unless the command actually passed.
Never claim a dashboard is production-ready merely because a route exists.
Never convert an unavailable/failed audit into "zero findings".

Return a concise final report containing:
- implementation summary
- files changed
- verification results
- remaining confirmed findings
- blockers
- dashboard status only where actual evidence supports it
"""


# ============================================================
# DATA CLASSES
# ============================================================

@dataclass
class SourceFile:
    path: str
    content: str


@dataclass
class Finding:
    id: str
    severity: str
    file: str
    function: str
    problem: str
    evidence: str
    impact: str
    fix: str
    confidence: str = "CONFIRMED"
    owner: str = ""


@dataclass
class WorkerResult:
    name: str
    success: bool
    output: str
    files: int
    chars: int
    seconds: float
    error: str | None = None


@dataclass
class ChangeOperation:
    action: str
    path: str
    search: str = ""
    replace: str = ""
    content: str = ""


@dataclass
class ImplementationResult:
    worker: str
    success: bool
    changes: list[ChangeOperation] = field(default_factory=list)
    notes: str = ""
    error: str | None = None


@dataclass
class VerificationResult:
    command: str
    success: bool
    stdout: str
    stderr: str
    seconds: float


# ============================================================
# GLOBALS
# ============================================================

progress_lock = threading.Lock()
file_lock = threading.Lock()


# ============================================================
# CLIENT
# ============================================================

def create_client() -> OpenAI:
    api_key = os.getenv("NVIDIA_API_KEY")

    if not api_key:
        raise RuntimeError(
            "NVIDIA_API_KEY is not set."
        )

    return OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=api_key,
        timeout=600,
        max_retries=0,
    )


# ============================================================
# GENERAL HELPERS
# ============================================================

def format_time(seconds: float) -> str:
    seconds = int(seconds)
    hours, remainder = divmod(seconds, 3600)
    minutes, seconds = divmod(remainder, 60)

    if hours:
        return f"{hours}h {minutes}m {seconds}s"
    if minutes:
        return f"{minutes}m {seconds}s"
    return f"{seconds}s"


def relative_path(path: Path) -> str:
    return path.resolve().relative_to(
        PROJECT_DIR
    ).as_posix()


def safe_repo_path(path_string: str) -> Path:
    normalized = path_string.strip().replace("\\", "/")

    if not normalized:
        raise ValueError("Empty repository path.")

    candidate = (PROJECT_DIR / normalized).resolve()

    try:
        candidate.relative_to(PROJECT_DIR)
    except ValueError as exc:
        raise ValueError(
            f"Path escapes repository: {path_string}"
        ) from exc

    return candidate


def read_text_file(path: Path) -> str:
    return path.read_text(
        encoding="utf-8",
        errors="ignore",
    )


def save_json(path: Path, value: Any) -> None:
    path.write_text(
        json.dumps(
            value,
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )


# ============================================================
# REPOSITORY SCAN
# ============================================================

def collect_files() -> list[SourceFile]:
    files: list[SourceFile] = []

    for path in PROJECT_DIR.rglob("*"):
        if not path.is_file():
            continue

        relative_parts = path.relative_to(
            PROJECT_DIR
        ).parts

        if any(
            part in IGNORE_DIRS
            for part in relative_parts
        ):
            continue

        if path.suffix.lower() not in ALLOWED_EXTENSIONS:
            continue

        try:
            content = read_text_file(path)
        except Exception:
            continue

        if not content.strip():
            continue

        files.append(
            SourceFile(
                path=relative_path(path),
                content=content,
            )
        )

    files.sort(key=lambda item: item.path)
    return files


# ============================================================
# RELEVANCE / CONTEXT
# ============================================================

def relevance_score(
    file: SourceFile,
    keywords: list[str],
) -> int:
    path_text = file.path.lower()
    content_text = file.content.lower()

    score = 0

    for keyword in keywords:
        keyword = keyword.lower()

        if keyword in path_text:
            score += 8

        count = content_text.count(keyword)

        if count:
            score += min(count, 8)

    return score


def build_context(
    files: list[SourceFile],
    keywords: list[str],
    max_chars: int = MAX_CONTEXT_CHARS,
) -> tuple[str, int, int]:

    ranked: list[tuple[int, SourceFile]] = []

    for file in files:
        score = relevance_score(
            file,
            keywords,
        )

        if score > 0:
            ranked.append(
                (
                    score,
                    file,
                )
            )

    ranked.sort(
        key=lambda item: (
            -item[0],
            len(item[1].content),
        )
    )

    blocks: list[str] = []
    total_chars = 0
    selected = 0

    for score, file in ranked:
        block = (
            f"\n===== FILE: {file.path} =====\n"
            f"{file.content}\n"
            f"===== END FILE =====\n"
        )

        if total_chars + len(block) > max_chars:
            continue

        blocks.append(block)
        total_chars += len(block)
        selected += 1

    return (
        "".join(blocks),
        selected,
        total_chars,
    )


def build_focused_context(
    files: list[SourceFile],
    paths: list[str],
    max_chars: int = MAX_CONTEXT_CHARS,
) -> str:

    normalized = {
        path.replace("\\", "/")
        for path in paths
    }

    file_map = {
        file.path: file
        for file in files
    }

    blocks: list[str] = []
    total_chars = 0

    for path in sorted(normalized):
        file = file_map.get(path)

        if not file:
            continue

        block = (
            f"\n===== FILE: {file.path} =====\n"
            f"{file.content}\n"
            f"===== END FILE =====\n"
        )

        if total_chars + len(block) > max_chars:
            continue

        blocks.append(block)
        total_chars += len(block)

    return "".join(blocks)


# ============================================================
# RELATED FILE EXPANSION
# ============================================================

def expand_related_paths(
    files: list[SourceFile],
    initial_paths: list[str],
) -> list[str]:

    path_map = {
        file.path: file
        for file in files
    }

    result = {
        path.replace("\\", "/")
        for path in initial_paths
    }

    # Central files that help implementation understand the architecture.
    important_files = {
        "packages/db/src/schema.ts",
        "apps/web/src/lib/trpc/server.ts",
    }

    for important in important_files:
        if important in path_map:
            result.add(important)

    # Resolve relative imports from initial finding files.
    for path in list(result):
        source = path_map.get(path)

        if not source:
            continue

        imports = re.findall(
            r"""from\s+['"]([^'"]+)['"]""",
            source.content,
        )

        for import_path in imports:
            if not import_path.startswith("."):
                continue

            base = Path(path).parent
            resolved = (base / import_path).as_posix()

            candidates = [
                resolved,
                f"{resolved}.ts",
                f"{resolved}.tsx",
                f"{resolved}.js",
                f"{resolved}.jsx",
                f"{resolved}/index.ts",
            ]

            for candidate in candidates:
                candidate = candidate.replace("\\", "/")

                if candidate in path_map:
                    result.add(candidate)
                    break

    return sorted(result)


# ============================================================
# MODEL CALL
# ============================================================

def call_model(
    client: OpenAI,
    messages: list[dict[str, str]],
    max_tokens: int,
    reasoning_budget: int,
    temperature: float,
    enable_thinking: bool,
) -> Any:

    last_error: Exception | None = None

    for attempt in range(
        1,
        MAX_RETRIES + 1,
    ):
        try:
            chat_kwargs: dict[str, Any] = {
                "chat_template_kwargs": {
                    "enable_thinking": enable_thinking,
                }
            }

            if enable_thinking and reasoning_budget > 0:
                chat_kwargs[
                    "chat_template_kwargs"
                ]["reasoning_budget"] = reasoning_budget

            return client.chat.completions.create(
                model=MODEL,
                messages=messages,
                temperature=temperature,
                top_p=0.9,
                max_tokens=max_tokens,
                extra_body=chat_kwargs,
            )

        except Exception as exc:
            last_error = exc

            if attempt >= MAX_RETRIES:
                raise

            wait = (
                RETRY_BASE_SECONDS
                * (2 ** (attempt - 1))
            )

            print(
                f"[MODEL RETRY] "
                f"attempt={attempt}/{MAX_RETRIES} "
                f"error={exc} "
                f"wait={wait}s"
            )

            time.sleep(wait)

    raise RuntimeError(
        str(last_error)
    )


# ============================================================
# JSON EXTRACTION FOR AUDIT ONLY
# ============================================================

def extract_json(text: str) -> dict[str, Any]:
    value = text.strip()

    value = re.sub(
        r"^```(?:json)?\s*",
        "",
        value,
        flags=re.IGNORECASE,
    )

    value = re.sub(
        r"\s*```$",
        "",
        value,
    )

    try:
        parsed = json.loads(value)

        if isinstance(parsed, dict):
            return parsed

    except json.JSONDecodeError:
        pass

    first = value.find("{")
    last = value.rfind("}")

    if first >= 0 and last > first:
        candidate = value[first:last + 1]

        try:
            parsed = json.loads(candidate)

            if isinstance(parsed, dict):
                return parsed

        except json.JSONDecodeError:
            pass

    raise ValueError(
        "Model did not return valid JSON."
    )


# ============================================================
# CHANGE-BLOCK PARSER
# ============================================================

def parse_change_blocks(
    text: str,
) -> list[ChangeOperation]:

    pattern = re.compile(
        r"===CHANGE===\s*"
        r"PATH:\s*(?P<path>[^\n\r]+)\s*"
        r"SEARCH:\s*\n(?P<search>.*?)\n"
        r"===REPLACE===\s*\n(?P<replace>.*?)\n"
        r"===END_CHANGE===",
        re.DOTALL,
    )

    changes: list[ChangeOperation] = []

    for match in pattern.finditer(text):
        changes.append(
            ChangeOperation(
                action="replace",
                path=match.group("path").strip(),
                search=match.group("search"),
                replace=match.group("replace"),
            )
        )

    if not changes:
        raise ValueError(
            "Nemotron returned no valid CHANGE blocks."
        )

    return changes


# ============================================================
# AUDIT WORKER
# ============================================================

def run_audit_worker(
    client: OpenAI,
    name: str,
    config: dict[str, Any],
    task: str,
    context: str,
    file_count: int,
    char_count: int,
) -> WorkerResult:

    started = time.time()

    prompt = f"""
USER TASK:

{task}

SPECIALIZED AUDIT:

{config["instruction"]}

Inspect the supplied source carefully.

Return only confirmed findings in the required JSON format.

SOURCE CODE:

{context}
"""

    try:
        response = call_model(
            client=client,
            messages=[
                {
                    "role": "system",
                    "content": AUDIT_SYSTEM_PROMPT,
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            max_tokens=AUDIT_MAX_TOKENS,
            reasoning_budget=AUDIT_REASONING_BUDGET,
            temperature=TEMPERATURE,
            enable_thinking=True,
        )

        output = (
            response.choices[0]
            .message.content
            or ""
        ).strip()

        # Validate JSON immediately.
        extract_json(output)

        return WorkerResult(
            name=name,
            success=True,
            output=output,
            files=file_count,
            chars=char_count,
            seconds=time.time() - started,
        )

    except Exception as exc:
        return WorkerResult(
            name=name,
            success=False,
            output="",
            files=file_count,
            chars=char_count,
            seconds=time.time() - started,
            error=str(exc),
        )


# ============================================================
# FINDING PARSING
# ============================================================

def parse_findings(
    results: list[WorkerResult],
) -> list[Finding]:

    findings: list[Finding] = []

    for result in results:

        if not result.success:
            continue

        try:
            data = extract_json(
                result.output
            )
        except Exception:
            continue

        raw_findings = data.get(
            "findings",
            [],
        )

        if not isinstance(
            raw_findings,
            list,
        ):
            continue

        for raw in raw_findings:

            if not isinstance(
                raw,
                dict,
            ):
                continue

            if raw.get("confidence") != "CONFIRMED":
                continue

            required = [
                "id",
                "severity",
                "file",
                "function",
                "problem",
                "evidence",
                "impact",
                "fix",
            ]

            if not all(
                raw.get(key)
                for key in required
            ):
                continue

            findings.append(
                Finding(
                    id=str(raw["id"]),
                    severity=str(raw["severity"]).upper(),
                    file=str(raw["file"]).replace(
                        "\\",
                        "/",
                    ),
                    function=str(
                        raw["function"]
                    ),
                    problem=str(
                        raw["problem"]
                    ),
                    evidence=str(
                        raw["evidence"]
                    ),
                    impact=str(
                        raw["impact"]
                    ),
                    fix=str(
                        raw["fix"]
                    ),
                    owner=result.name,
                )
            )

    return findings


def dedupe_findings(
    findings: list[Finding],
) -> list[Finding]:

    rank = {
        "CRITICAL": 0,
        "HIGH": 1,
        "MEDIUM": 2,
        "LOW": 3,
    }

    findings.sort(
        key=lambda item: (
            rank.get(
                item.severity,
                99,
            ),
            item.file,
            item.function,
            item.problem,
        )
    )

    seen: set[
        tuple[str, str, str]
    ] = set()

    result: list[Finding] = []

    for finding in findings:

        key = (
            finding.file,
            finding.function,
            re.sub(
                r"\s+",
                " ",
                finding.problem.lower().strip(),
            ),
        )

        if key in seen:
            continue

        seen.add(key)

        if owns_file(
            finding.owner,
            finding.file,
        ):
            finding.owner = finding.owner
        else:
            finding.owner = choose_owner(
                finding.file
            )

        result.append(finding)

    return result


# ============================================================
# OWNERSHIP
# ============================================================

def owns_file(
    worker_name: str,
    path: str,
) -> bool:

    config = WORKERS.get(worker_name)

    if not config:
        return False

    normalized = path.replace("\\", "/")

    for prefix in config.get(
        "owned_prefixes",
        [],
    ):
        prefix = prefix.rstrip("/")

        if (
            normalized == prefix
            or normalized.startswith(
                prefix + "/"
            )
        ):
            return True

    return False


def choose_owner(path: str) -> str:

    # More specific paths first.
    candidates: list[
        tuple[int, str]
    ] = []

    normalized = path.replace(
        "\\",
        "/",
    )

    for name, config in WORKERS.items():
        for prefix in config.get(
            "owned_prefixes",
            [],
        ):
            prefix = prefix.rstrip("/")

            if (
                normalized == prefix
                or normalized.startswith(
                    prefix + "/"
                )
            ):
                candidates.append(
                    (
                        len(prefix),
                        name,
                    )
                )

    if candidates:
        candidates.sort(
            reverse=True
        )
        return candidates[0][1]

    return "backend_api"


# ============================================================
# IMPLEMENTATION WORKER
# ============================================================

def run_implementation_worker(
    client: OpenAI,
    worker_name: str,
    findings: list[Finding],
    files: list[SourceFile],
) -> ImplementationResult:

    if not findings:
        return ImplementationResult(
            worker=worker_name,
            success=True,
            notes="No assigned findings.",
        )

    initial_paths = [
        finding.file
        for finding in findings
    ]

    related_paths = expand_related_paths(
        files,
        initial_paths,
    )

    context = build_focused_context(
        files,
        related_paths,
    )

    finding_text = "\n\n".join(
        f"""
ISSUE ID: {finding.id}
SEVERITY: {finding.severity}
FILE: {finding.file}
FUNCTION: {finding.function}

PROBLEM:
{finding.problem}

EVIDENCE:
{finding.evidence}

IMPACT:
{finding.impact}

REQUIRED FIX:
{finding.fix}
"""
        for finding in findings
    )

    prompt = f"""
You are implementing confirmed production defects.

WORKER:
{worker_name}

CONFIRMED FINDINGS:

{finding_text}

Inspect all supplied source before generating changes.

Do the implementation directly through exact change blocks.

SOURCE CODE:

{context}
"""

    try:
        response = call_model(
            client=client,
            messages=[
                {
                    "role": "system",
                    "content": IMPLEMENT_SYSTEM_PROMPT,
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            max_tokens=IMPLEMENT_MAX_TOKENS,
            reasoning_budget=IMPLEMENT_REASONING_BUDGET,
            temperature=0.10,
            enable_thinking=False,
        )

        output = (
            response.choices[0]
            .message.content
            or ""
        ).strip()

        changes = parse_change_blocks(
            output
        )

        return ImplementationResult(
            worker=worker_name,
            success=True,
            changes=changes,
            notes="Implementation changes generated.",
        )

    except Exception as exc:
        return ImplementationResult(
            worker=worker_name,
            success=False,
            error=str(exc),
        )


# ============================================================
# APPLY CHANGES
# ============================================================

def apply_change(
    change: ChangeOperation,
) -> tuple[bool, str]:

    path = safe_repo_path(
        change.path
    )

    with file_lock:

        if change.action == "replace":

            if not path.exists():
                return (
                    False,
                    f"File not found: {change.path}",
                )

            content = read_text_file(
                path
            )

            occurrences = content.count(
                change.search
            )

            if occurrences != 1:
                return (
                    False,
                    (
                        f"Expected exactly one match in "
                        f"{change.path}; got {occurrences}"
                    ),
                )

            updated = content.replace(
                change.search,
                change.replace,
                1,
            )

            path.write_text(
                updated,
                encoding="utf-8",
            )

            return (
                True,
                f"UPDATED {change.path}",
            )

        if change.action == "create":

            if path.exists():
                return (
                    False,
                    f"File already exists: {change.path}",
                )

            path.parent.mkdir(
                parents=True,
                exist_ok=True,
            )

            path.write_text(
                change.content,
                encoding="utf-8",
            )

            return (
                True,
                f"CREATED {change.path}",
            )

        if change.action == "delete":

            if not path.exists():
                return (
                    False,
                    f"File not found: {change.path}",
                )

            path.unlink()

            return (
                True,
                f"DELETED {change.path}",
            )

        return (
            False,
            f"Unknown action: {change.action}",
        )


def apply_implementation_results(
    results: list[ImplementationResult],
) -> tuple[list[str], list[str], list[str]]:

    successful: list[str] = []
    failed: list[str] = []
    changed_paths: list[str] = []

    round_paths: set[str] = set()

    for result in results:

        if not result.success:

            failed.append(
                f"{result.worker}: {result.error}"
            )

            continue

        for change in result.changes:

            normalized = (
                change.path
                .replace("\\", "/")
            )

            if normalized in round_paths:

                failed.append(
                    f"{result.worker}: file conflict "
                    f"for {normalized}"
                )

                continue

            ok, message = apply_change(
                change
            )

            if ok:

                round_paths.add(
                    normalized
                )

                changed_paths.append(
                    normalized
                )

                successful.append(
                    message
                )

            else:

                failed.append(
                    f"{result.worker}: {message}"
                )

    return (
        successful,
        failed,
        changed_paths,
    )


# ============================================================
# PACKAGE MANAGEMENT
# ============================================================

def detect_package_manager() -> str:

    if (
        PROJECT_DIR / "pnpm-lock.yaml"
    ).exists():
        return "pnpm"

    if (
        PROJECT_DIR / "bun.lockb"
    ).exists():
        return "bun"

    if (
        PROJECT_DIR / "bun.lock"
    ).exists():
        return "bun"

    if (
        PROJECT_DIR / "yarn.lock"
    ).exists():
        return "yarn"

    if (
        PROJECT_DIR / "package-lock.json"
    ).exists():
        return "npm"

    return "npm"


def load_package_json() -> dict[str, Any]:

    path = PROJECT_DIR / "package.json"

    if not path.exists():
        return {}

    try:
        value = json.loads(
            read_text_file(path)
        )

        return (
            value
            if isinstance(
                value,
                dict,
            )
            else {}
        )

    except Exception:
        return {}


def available_scripts() -> dict[str, str]:

    package = load_package_json()

    scripts = package.get(
        "scripts",
        {},
    )

    if not isinstance(
        scripts,
        dict,
    ):
        return {}

    return {
        str(k): str(v)
        for k, v in scripts.items()
    }


def get_verification_commands() -> list[str]:

    explicit = os.getenv(
        "EVALUNA_VERIFY_COMMANDS"
    )

    if explicit:

        try:
            parsed = json.loads(
                explicit
            )

            if isinstance(
                parsed,
                list,
            ):
                return [
                    str(x)
                    for x in parsed
                    if str(x).strip()
                ]

        except json.JSONDecodeError:
            return [
                value.strip()
                for value in explicit.split(";")
                if value.strip()
            ]

    scripts = available_scripts()
    runner = detect_package_manager()

    aliases = [
        [
            "typecheck",
            "type-check",
            "check-types",
        ],
        [
            "lint",
        ],
        [
            "test",
            "test:unit",
        ],
        [
            "test:integration",
            "integration",
        ],
        [
            "test:e2e",
            "e2e",
        ],
        [
            "build",
        ],
    ]

    commands: list[str] = []
    seen: set[str] = set()

    for candidates in aliases:

        for script in candidates:

            if script in scripts:

                command = (
                    f"{runner} run {script}"
                )

                if command not in seen:

                    commands.append(
                        command
                    )

                    seen.add(
                        command
                    )

                break

    # If no package scripts exist, fall back to repository-local
    # TypeScript checking only if tsconfig exists.
    if (
        not commands
        and (
            PROJECT_DIR / "tsconfig.json"
        ).exists()
    ):
        commands.append(
            f"{runner} exec tsc --noEmit"
        )

    return commands


# ============================================================
# VERIFICATION
# ============================================================

def run_command(
    command: str,
) -> VerificationResult:

    started = time.time()

    print(
        f"[VERIFY] START {command}"
    )

    try:
        result = subprocess.run(
            command,
            cwd=str(PROJECT_DIR),
            shell=True,
            capture_output=True,
            text=True,
            timeout=COMMAND_TIMEOUT_SECONDS,
        )

        stdout = result.stdout or ""
        stderr = result.stderr or ""

        success = (
            result.returncode == 0
        )

        print(
            f"[VERIFY] "
            f"{'PASS' if success else 'FAIL'} "
            f"{format_time(time.time() - started)}"
        )

        return VerificationResult(
            command=command,
            success=success,
            stdout=stdout,
            stderr=stderr,
            seconds=time.time() - started,
        )

    except subprocess.TimeoutExpired as exc:

        stdout = (
            exc.stdout.decode(
                errors="ignore"
            )
            if isinstance(
                exc.stdout,
                bytes,
            )
            else (
                exc.stdout or ""
            )
        )

        stderr = (
            exc.stderr.decode(
                errors="ignore"
            )
            if isinstance(
                exc.stderr,
                bytes,
            )
            else (
                exc.stderr or ""
            )
        )

        return VerificationResult(
            command=command,
            success=False,
            stdout=stdout,
            stderr=(
                stderr
                + "\nCOMMAND TIMED OUT"
            ),
            seconds=time.time() - started,
        )

    except Exception as exc:

        return VerificationResult(
            command=command,
            success=False,
            stdout="",
            stderr=str(exc),
            seconds=time.time() - started,
        )


def verify_repository(
    commands: list[str],
) -> list[VerificationResult]:

    results: list[VerificationResult] = []

    for command in commands:

        result = run_command(
            command
        )

        results.append(
            result
        )

        if not result.success:
            break

    return results


def verification_is_green(
    results: list[VerificationResult],
) -> bool:

    if not results:
        return False

    return all(
        result.success
        for result in results
    )


# ============================================================
# ERROR PATH EXTRACTION
# ============================================================

def extract_paths_from_errors(
    text: str,
) -> list[str]:

    patterns = [
        r"([A-Za-z]:\\[^:\n\r]+?\.(?:ts|tsx|js|jsx|mjs|cjs|sql))",
        r"((?:apps|packages|src|scripts)/[^:\n\r]+?\.(?:ts|tsx|js|jsx|mjs|cjs|sql))",
    ]

    found: set[str] = set()

    for pattern in patterns:

        for match in re.finditer(
            pattern,
            text,
            flags=re.IGNORECASE,
        ):

            raw = match.group(1)

            try:
                candidate = Path(raw)

                if candidate.is_absolute():

                    resolved = candidate.resolve()

                    try:
                        relative = resolved.relative_to(
                            PROJECT_DIR
                        )

                    except ValueError:
                        continue

                    found.add(
                        relative.as_posix()
                    )

                else:

                    found.add(
                        raw.replace(
                            "\\",
                            "/",
                        )
                    )

            except Exception:
                continue

    return sorted(found)


def verification_failure_text(
    results: list[VerificationResult],
) -> str:

    chunks: list[str] = []

    for result in results:

        if result.success:
            continue

        chunks.append(
            f"""
COMMAND:
{result.command}

STDOUT:
{result.stdout[-30000:]}

STDERR:
{result.stderr[-30000:]}
"""
        )

    return "\n".join(chunks)


# ============================================================
# REPAIR WORKER
# ============================================================

def run_repair_worker(
    client: OpenAI,
    task: str,
    failure_text: str,
    changed_paths: list[str],
    files: list[SourceFile],
) -> ImplementationResult:

    context_paths = expand_related_paths(
        files,
        changed_paths,
    )

    context = build_focused_context(
        files,
        context_paths,
    )

    prompt = f"""
ORIGINAL TASK:

{task}

AUTOMATED VERIFICATION FAILED:

{failure_text}

FILES ALREADY TOUCHED:

{json.dumps(
    changed_paths,
    indent=2,
)}

Inspect the actual current source and repair the failure.

SOURCE CODE:

{context}
"""

    try:

        response = call_model(
            client=client,
            messages=[
                {
                    "role": "system",
                    "content": REPAIR_SYSTEM_PROMPT,
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            max_tokens=REPAIR_MAX_TOKENS,
            reasoning_budget=REPAIR_REASONING_BUDGET,
            temperature=0.10,
            enable_thinking=False,
        )

        output = (
            response.choices[0]
            .message.content
            or ""
        ).strip()

        changes = parse_change_blocks(
            output
        )

        return ImplementationResult(
            worker="repair",
            success=True,
            changes=changes,
            notes="Repair changes generated.",
        )

    except Exception as exc:

        return ImplementationResult(
            worker="repair",
            success=False,
            error=str(exc),
        )


# ============================================================
# GIT
# ============================================================

def git_status() -> str:

    result = subprocess.run(
        "git status --short",
        cwd=str(PROJECT_DIR),
        shell=True,
        capture_output=True,
        text=True,
    )

    return result.stdout or ""


def git_diff_check() -> VerificationResult:
    return run_command(
        "git diff --check"
    )


def save_git_state(
    label: str,
) -> None:

    try:

        (
            OUTPUT_DIR
            / f"{label}_git_status.txt"
        ).write_text(
            git_status(),
            encoding="utf-8",
        )

        diff = subprocess.run(
            "git diff --stat",
            cwd=str(PROJECT_DIR),
            shell=True,
            capture_output=True,
            text=True,
        )

        (
            OUTPUT_DIR
            / f"{label}_git_diff_stat.txt"
        ).write_text(
            diff.stdout or "",
            encoding="utf-8",
        )

    except Exception:
        pass


# ============================================================
# IMPLEMENTATION PHASE
# ============================================================

def implementation_phase(
    client: OpenAI,
    findings: list[Finding],
    files: list[SourceFile],
) -> tuple[list[str], list[str], list[str]]:

    if not findings:
        print(
            "\nNo confirmed implementation findings."
        )

        return [], [], []

    groups: dict[
        str,
        list[Finding]
    ] = {}

    for finding in findings:
        owner = choose_owner(
            finding.file
        )
        finding.owner = owner
        groups.setdefault(
            owner,
            [],
        ).append(finding)

    jobs: list[
        tuple[str, list[Finding]]
    ] = []

    for owner, group in groups.items():

        for start in range(
            0,
            len(group),
            MAX_FINDINGS_PER_BATCH,
        ):

            jobs.append(
                (
                    owner,
                    group[
                        start:
                        start + MAX_FINDINGS_PER_BATCH
                    ],
                )
            )

    implementation_results: list[
        ImplementationResult
    ] = []

    print("\n")
    print("=" * 70)
    print("IMPLEMENTATION WORKERS")
    print("=" * 70)

    with ThreadPoolExecutor(
        max_workers=IMPLEMENTATION_WORKERS
    ) as executor:

        futures = {}

        for owner, batch in jobs:

            future = executor.submit(
                run_implementation_worker,
                client,
                owner,
                batch,
                files,
            )

            futures[future] = owner

        for future in as_completed(
            futures
        ):

            owner = futures[
                future
            ]

            result = future.result()

            implementation_results.append(
                result
            )

            if result.success:

                print(
                    f"[IMPLEMENTER PASS] "
                    f"{owner:<25} "
                    f"{len(result.changes)} changes"
                )

            else:

                print(
                    f"[IMPLEMENTER FAIL] "
                    f"{owner:<25} "
                    f"{result.error}"
                )

    return apply_implementation_results(
        implementation_results
    )


# ============================================================
# FINAL SYNTHESIS
# ============================================================

def final_synthesis(
    client: OpenAI,
    task: str,
    findings: list[Finding],
    remaining_findings: list[Finding],
    changed_files: list[str],
    implementation_errors: list[str],
    verification_results: list[VerificationResult],
    audit_success_count: int,
    audit_total: int,
    reaudit_success_count: int,
    reaudited_total: int,
) -> str:

    verification = [
        {
            "command": result.command,
            "success": result.success,
            "seconds": round(
                result.seconds,
                2,
            ),
            "stdout_tail": result.stdout[-5000:],
            "stderr_tail": result.stderr[-5000:],
        }
        for result in verification_results
    ]

    evidence = {
        "audit": {
            "successful": audit_success_count,
            "total": audit_total,
        },
        "reaudit": {
            "successful": reaudit_success_count,
            "total": reaudited_total,
        },
        "confirmed_findings": [
            {
                "id": f.id,
                "severity": f.severity,
                "file": f.file,
                "function": f.function,
                "problem": f.problem,
                "evidence": f.evidence,
                "impact": f.impact,
                "fix": f.fix,
                "owner": f.owner,
            }
            for f in findings
        ],
        "remaining_findings": [
            {
                "id": f.id,
                "severity": f.severity,
                "file": f.file,
                "function": f.function,
                "problem": f.problem,
                "evidence": f.evidence,
                "impact": f.impact,
                "fix": f.fix,
            }
            for f in remaining_findings
        ],
        "changed_files": sorted(
            set(changed_files)
        ),
        "implementation_errors": implementation_errors,
        "verification": verification,
        "git_status": git_status(),
    }

    prompt = f"""
TASK:

{task}

MACHINE-VERIFIED EVIDENCE:

{json.dumps(
    evidence,
    indent=2,
    ensure_ascii=False,
)}

Produce the final concise implementation report.

Rules:

- Never call an unavailable audit "clean".
- If re-audit did not fully succeed, say verification is incomplete.
- Do not call the ERP production-ready unless the evidence supports that conclusion.
- Distinguish attempted changes from verified changes.
- Never claim tests passed if they failed or were not run.
"""

    try:

        response = call_model(
            client=client,
            messages=[
                {
                    "role": "system",
                    "content": FINAL_SYSTEM_PROMPT,
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            max_tokens=FINAL_MAX_TOKENS,
            reasoning_budget=FINAL_REASONING_BUDGET,
            temperature=0.10,
            enable_thinking=True,
        )

        return (
            response.choices[0]
            .message.content
            or ""
        ).strip()

    except Exception as exc:

        return (
            "# FINAL IMPLEMENTATION REPORT\n\n"
            f"Final synthesis failed: {exc}\n\n"
            "See the machine-generated JSON artifacts "
            "inside nemotron_audits."
        )


# ============================================================
# TERMINAL TASK INPUT
# ============================================================

def read_task_from_terminal() -> str:

    print("\n")
    print("=" * 70)
    print("EVALUNA ERP — NEMOTRON IMPLEMENTATION AGENT")
    print("=" * 70)
    print(
        "Paste your complete implementation task."
    )
    print(
        f"Finish with exactly: {TASK_END_MARKER}"
    )
    print("-" * 70)

    lines: list[str] = []

    while True:

        try:
            line = input()

        except EOFError:
            raise RuntimeError(
                f"Input ended before {TASK_END_MARKER}."
            )

        if (
            line.strip()
            == TASK_END_MARKER
        ):
            break

        lines.append(line)

    task = "\n".join(
        lines
    ).strip()

    if not task:
        raise RuntimeError(
            "Task cannot be empty."
        )

    return task


# ============================================================
# MAIN
# ============================================================

def main() -> None:

    global start_time
    start_time = time.time()

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    if not PROJECT_DIR.exists():

        raise RuntimeError(
            f"Project directory does not exist:\n"
            f"{PROJECT_DIR}"
        )

    print("=" * 70)
    print("EVALUNA ERP — NEMOTRON AUDIT + CODE + VERIFY")
    print("=" * 70)
    print(
        f"Project: {PROJECT_DIR}"
    )
    print(
        f"Model:   {MODEL}"
    )
    print(
        f"Audit workers: {AUDIT_WORKERS}"
    )
    print(
        f"Implementation workers: {IMPLEMENTATION_WORKERS}"
    )

    task = read_task_from_terminal()

    client = create_client()

    save_git_state(
        "before"
    )

    # --------------------------------------------------------
    # INITIAL SCAN
    # --------------------------------------------------------

    scan_started = time.time()

    files = collect_files()

    print(
        f"\nRepository scan: "
        f"{len(files)} source files | "
        f"{format_time(time.time() - scan_started)}"
    )

    # --------------------------------------------------------
    # AUDIT WORKER PREPARATION
    # --------------------------------------------------------

    prepared = []

    for name, config in WORKERS.items():

        context, count, chars = build_context(
            files,
            config["keywords"],
        )

        prepared.append(
            (
                name,
                config,
                context,
                count,
                chars,
            )
        )

        print(
            f"[AUDIT READY] "
            f"{name:<25} "
            f"{count:>4} files | "
            f"{chars:>9,} chars"
        )

    # --------------------------------------------------------
    # PARALLEL AUDIT
    # --------------------------------------------------------

    print("\n")
    print("=" * 70)
    print("PARALLEL AUDIT")
    print("=" * 70)

    audit_results: list[WorkerResult] = []

    with ThreadPoolExecutor(
        max_workers=AUDIT_WORKERS
    ) as executor:

        futures = {}

        for (
            name,
            config,
            context,
            count,
            chars,
        ) in prepared:

            future = executor.submit(
                run_audit_worker,
                client,
                name,
                config,
                task,
                context,
                count,
                chars,
            )

            futures[future] = name

        for future in as_completed(
            futures
        ):

            name = futures[
                future
            ]

            result = future.result()

            audit_results.append(
                result
            )

            if result.success:

                print(
                    f"[AUDIT PASS] "
                    f"{name:<25} "
                    f"{format_time(result.seconds)}"
                )

            else:

                print(
                    f"[AUDIT FAIL] "
                    f"{name:<25} "
                    f"{result.error}"
                )

    audit_success_count = sum(
        1
        for result in audit_results
        if result.success
    )

    save_json(
        OUTPUT_DIR / "raw_audit_workers.json",
        [
            {
                "worker": result.name,
                "success": result.success,
                "output": result.output,
                "error": result.error,
                "files": result.files,
                "chars": result.chars,
                "seconds": result.seconds,
            }
            for result in audit_results
        ],
    )

    findings = dedupe_findings(
        parse_findings(
            audit_results
        )
    )

    print(
        f"\nConfirmed findings from successful auditors: "
        f"{len(findings)}"
    )

    save_json(
        OUTPUT_DIR / "confirmed_findings.json",
        [
            {
                "id": f.id,
                "severity": f.severity,
                "file": f.file,
                "function": f.function,
                "problem": f.problem,
                "evidence": f.evidence,
                "impact": f.impact,
                "fix": f.fix,
                "owner": f.owner,
            }
            for f in findings
        ],
    )

    # --------------------------------------------------------
    # IMPLEMENT
    # --------------------------------------------------------

    changed_files, implementation_errors, changed_paths = (
        implementation_phase(
            client,
            findings,
            files,
        )
    )

    print("\n")
    print("=" * 70)
    print("IMPLEMENTATION RESULT")
    print("=" * 70)

    print(
        f"Applied changes: {len(changed_files)}"
    )

    for change in changed_files:
        print(
            f"  {change}"
        )

    if implementation_errors:

        print(
            "\nImplementation errors:"
        )

        for error in implementation_errors:
            print(
                f"  {error}"
            )

    # --------------------------------------------------------
    # REFRESH FILES
    # --------------------------------------------------------

    files = collect_files()

    # --------------------------------------------------------
    # VERIFICATION
    # --------------------------------------------------------

    verification_commands = (
        get_verification_commands()
    )

    print("\n")
    print("=" * 70)
    print("AUTOMATED VERIFICATION")
    print("=" * 70)

    if not verification_commands:

        print(
            "WARNING: No verification scripts were discovered."
        )

        verification_results: list[
            VerificationResult
        ] = []

    else:

        for command in verification_commands:
            print(
                f"  {command}"
            )

        verification_results = verify_repository(
            verification_commands
        )

    # Always perform diff-check.
    diff_check = git_diff_check()

    verification_results.append(
        diff_check
    )

    # --------------------------------------------------------
    # REPAIR LOOP
    # --------------------------------------------------------

    repair_round = 0

    while (
        verification_results
        and not verification_is_green(
            verification_results
        )
        and repair_round < MAX_REPAIR_ROUNDS
    ):

        repair_round += 1

        print("\n")
        print("=" * 70)
        print(
            f"REPAIR ROUND "
            f"{repair_round}/{MAX_REPAIR_ROUNDS}"
        )
        print("=" * 70)

        failure_text = verification_failure_text(
            verification_results
        )

        repair_paths = sorted(
            set(
                changed_paths
            )
            | set(
                extract_paths_from_errors(
                    failure_text
                )
            )
        )

        if not repair_paths:
            repair_paths = [
                f.file
                for f in findings
            ]

        repair_result = run_repair_worker(
            client=client,
            task=task,
            failure_text=failure_text,
            changed_paths=repair_paths,
            files=files,
        )

        if not repair_result.success:

            implementation_errors.append(
                "Repair worker failed: "
                + str(
                    repair_result.error
                )
            )

            break

        repair_success, repair_failures, repair_changed = (
            apply_implementation_results(
                [repair_result]
            )
        )

        changed_files.extend(
            repair_success
        )

        changed_paths.extend(
            repair_changed
        )

        implementation_errors.extend(
            repair_failures
        )

        if not repair_success:

            implementation_errors.append(
                "Repair worker produced no safely applicable changes."
            )

            break

        files = collect_files()

        verification_results = verify_repository(
            verification_commands
        )

        verification_results.append(
            git_diff_check()
        )

    # --------------------------------------------------------
    # FINAL RE-AUDIT
    # --------------------------------------------------------

    print("\n")
    print("=" * 70)
    print("FINAL RE-AUDIT")
    print("=" * 70)

    files = collect_files()

    if changed_paths:

        reaudit_names: list[str] = []

        for worker_name, config in WORKERS.items():

            if any(
                owns_file(
                    worker_name,
                    path,
                )
                for path in changed_paths
            ):
                reaaudit_names.append(
                    worker_name
                )

        if not reaaudit_names:
            reaaudit_names = list(
                WORKERS.keys()
            )

    else:

        reaudit_names = list(
            WORKERS.keys()
        )

    reaudited_results: list[
        WorkerResult
    ] = []

    for worker_name in reaudit_names:

        config = WORKERS[
            worker_name
        ]

        context, count, chars = build_context(
            files,
            config["keywords"],
        )

        result = run_audit_worker(
            client,
            worker_name,
            config,
            task,
            context,
            count,
            chars,
        )

        reaudited_results.append(
            result
        )

        if result.success:

            print(
                f"[REAUDIT PASS] "
                f"{worker_name}"
            )

        else:

            print(
                f"[REAUDIT FAIL] "
                f"{worker_name}: "
                f"{result.error}"
            )

    reaudit_success_count = sum(
        1
        for result in reaudited_results
        if result.success
    )

    reaudited_total = len(
        reaudited_results
    )

    remaining_findings = dedupe_findings(
        parse_findings(
            reaudited_results
        )
    )

    # If every re-audit failed, preserving the original findings
    # is safer than falsely declaring zero remaining issues.
    if (
        reaudited_total > 0
        and reaudit_success_count == 0
    ):

        remaining_findings = findings

    save_json(
        OUTPUT_DIR / "remaining_findings.json",
        [
            {
                "id": f.id,
                "severity": f.severity,
                "file": f.file,
                "function": f.function,
                "problem": f.problem,
                "evidence": f.evidence,
                "impact": f.impact,
                "fix": f.fix,
                "owner": f.owner,
            }
            for f in remaining_findings
        ],
    )

    # --------------------------------------------------------
    # FINAL REPORT
    # --------------------------------------------------------

    report = final_synthesis(
        client=client,
        task=task,
        findings=findings,
        remaining_findings=remaining_findings,
        changed_files=changed_files,
        implementation_errors=implementation_errors,
        verification_results=verification_results,
        audit_success_count=audit_success_count,
        audit_total=len(audit_results),
        reaudit_success_count=reaudit_success_count,
        reaudited_total=reaudited_total,
    )

    timestamp = datetime.now().strftime(
        "%Y%m%d_%H%M%S"
    )

    timestamped_report = (
        OUTPUT_DIR
        / f"MASTER_IMPLEMENTATION_{timestamp}.md"
    )

    latest_report = (
        OUTPUT_DIR
        / "MASTER_IMPLEMENTATION.md"
    )

    timestamped_report.write_text(
        report,
        encoding="utf-8",
    )

    latest_report.write_text(
        report,
        encoding="utf-8",
    )

    # --------------------------------------------------------
    # MACHINE METADATA
    # --------------------------------------------------------

    metadata = {
        "timestamp": timestamp,
        "project_dir": str(PROJECT_DIR),
        "model": MODEL,
        "audit_workers": AUDIT_WORKERS,
        "implementation_workers": IMPLEMENTATION_WORKERS,
        "source_files": len(files),
        "audit_successful": audit_success_count,
        "audit_total": len(audit_results),
        "confirmed_findings": len(findings),
        "remaining_findings": len(
            remaining_findings
        ),
        "reaudit_successful": reaudit_success_count,
        "reaudit_total": reaudited_total,
        "changed_files": sorted(
            set(changed_files)
        ),
        "implementation_errors": implementation_errors,
        "repair_rounds": repair_round,
        "verification_green": verification_is_green(
            verification_results
        ),
        "verification": [
            {
                "command": result.command,
                "success": result.success,
                "seconds": round(
                    result.seconds,
                    2,
                ),
            }
            for result in verification_results
        ],
        "total_seconds": round(
            time.time() - start_time,
            2,
        ),
    }

    save_json(
        OUTPUT_DIR / "run_metadata.json",
        metadata,
    )

    save_git_state(
        "after"
    )

    # --------------------------------------------------------
    # FINAL TERMINAL
    # --------------------------------------------------------

    print("\n")
    print("=" * 70)
    print("RUN COMPLETE")
    print("=" * 70)

    print(
        f"Audits successful : "
        f"{audit_success_count}/{len(audit_results)}"
    )

    print(
        f"Confirmed findings: "
        f"{len(findings)}"
    )

    print(
        f"Changed files     : "
        f"{len(set(changed_files))}"
    )

    print(
        f"Repair rounds     : "
        f"{repair_round}"
    )

    print(
        f"Re-audit          : "
        f"{reaudit_success_count}/{reaudited_total}"
    )

    print(
        f"Remaining findings: "
        f"{len(remaining_findings)}"
    )

    print(
        f"Verification      : "
        f"{'PASS' if verification_is_green(verification_results) else 'FAIL'}"
    )

    print(
        f"Report            : "
        f"{latest_report}"
    )

    print(
        f"Total time        : "
        f"{format_time(time.time() - start_time)}"
    )

    print("=" * 70)


if __name__ == "__main__":
    main()
