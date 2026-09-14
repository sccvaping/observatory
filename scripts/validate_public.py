from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FORBIDDEN_DIRECTORY_NAMES = {"raw", "working", "protected", "investigation", "private", "credentials", "secrets"}
REQUIRED_SITE_FILES = [
    "index.html", "health.html", "cessation.html", "prevalence.html", "evidence.html",
    "methodology.html", "privacy.html", "review.html", "academic.html", "robots.txt", "sitemap.xml",
]
MANIFESTED_DATA_ROOTS = ("data/public", "evidence", "environment", "regulation", "provenance")
REVIEWED_STATES = {"reviewed", "verified", "validated", "human_reviewed"}
SYNTHESIS_READY_STATES = {"synthesis_ready", "ready_for_synthesis", "validated_for_synthesis", "quantitative_synthesis_ready"}


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def generated_files() -> set[str]:
    out: set[str] = set()
    for rel_root in MANIFESTED_DATA_ROOTS:
        source = ROOT / rel_root
        if not source.exists():
            continue
        for path in source.rglob("*"):
            if path.is_file() and path.name != "README.md" and path.relative_to(ROOT).as_posix() != "provenance/publication_manifest.json":
                out.add(path.relative_to(ROOT).as_posix())
    return out


def validate_manifest(errors: list[str]) -> None:
    manifest_path = ROOT / "provenance" / "publication_manifest.json"
    if not manifest_path.exists():
        errors.append("publication manifest missing")
        return
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"invalid publication manifest: {exc}")
        return
    files = manifest.get("files")
    if not isinstance(files, list):
        errors.append("publication manifest has no files list")
        return
    manifested: set[str] = set()
    for item in files:
        if not isinstance(item, dict) or not isinstance(item.get("path"), str):
            errors.append("invalid manifest file entry")
            continue
        rel = Path(item["path"])
        if rel.is_absolute() or ".." in rel.parts:
            errors.append(f"unsafe manifest path: {item.get('path')}")
            continue
        rel_text = rel.as_posix()
        if rel_text in manifested:
            errors.append(f"duplicate manifest path: {rel_text}")
            continue
        manifested.add(rel_text)
        path = ROOT / rel
        if not path.is_file():
            errors.append(f"manifest file missing: {rel_text}")
            continue
        if item.get("sha256") != sha256(path):
            errors.append(f"manifest hash mismatch: {rel_text}")
        if item.get("bytes") != path.stat().st_size:
            errors.append(f"manifest byte-size mismatch: {rel_text}")
    for rel in sorted(generated_files() - manifested):
        errors.append(f"generated public data not covered by manifest: {rel}")


def validate_evidence_cards(errors: list[str]) -> None:
    path = ROOT / "evidence" / "evidence_cards.json"
    if not path.exists():
        return
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"invalid evidence cards: {exc}")
        return
    records = payload.get("records")
    if not isinstance(records, list):
        errors.append("evidence cards have no records list")
        return
    if payload.get("card_count") != len(records):
        errors.append("evidence card_count does not reconcile")
    designs = Counter()
    integrity = Counter()
    year_now = datetime.now(timezone.utc).year
    for index, record in enumerate(records):
        if not isinstance(record, dict):
            errors.append(f"evidence record {index} is not an object")
            continue
        evidence_id = record.get("evidence_id")
        if not isinstance(evidence_id, str) or not evidence_id.strip():
            errors.append(f"evidence record {index} has no stable evidence_id")
        designs[str(record.get("study_design") or "unknown")] += 1
        integrity[str(record.get("integrity_status") or "unknown")] += 1
        year = record.get("year")
        if year not in (None, ""):
            year_text = str(year).strip()
            if not re.fullmatch(r"\d{4}", year_text):
                errors.append(f"{evidence_id or index}: invalid publication year")
            elif int(year_text) > year_now + 1:
                errors.append(f"{evidence_id or index}: implausible future publication year")
        readiness = str(record.get("synthesis_readiness") or "").strip().lower()
        review = str(record.get("human_review_status") or "").strip().lower()
        if readiness in SYNTHESIS_READY_STATES and review not in REVIEWED_STATES:
            errors.append(f"{evidence_id or index}: synthesis-ready state requires completed human review")
    if isinstance(payload.get("study_design_counts"), dict) and dict(designs) != payload["study_design_counts"]:
        errors.append("study_design_counts do not reconcile")
    if isinstance(payload.get("integrity_status_counts"), dict) and dict(integrity) != payload["integrity_status_counts"]:
        errors.append("integrity_status_counts do not reconcile")


def validate_repository() -> list[str]:
    errors: list[str] = []
    for required in REQUIRED_SITE_FILES:
        if not (ROOT / required).exists():
            errors.append(f"missing required public site file: {required}")
    for path in ROOT.rglob("*"):
        if not path.is_file() or ".git" in path.parts:
            continue
        rel = path.relative_to(ROOT)
        if {part.lower() for part in rel.parts[:-1]} & FORBIDDEN_DIRECTORY_NAMES:
            errors.append(f"forbidden public path: {rel}")
    validate_manifest(errors)
    validate_evidence_cards(errors)
    return errors


def main() -> int:
    errors = validate_repository()
    if errors:
        print("PUBLIC VALIDATION FAILED")
        for error in errors:
            print(f" - {error}")
        return 1
    print("PUBLIC VALIDATION PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
