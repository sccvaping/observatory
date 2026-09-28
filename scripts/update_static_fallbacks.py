from __future__ import annotations

from datetime import datetime
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX_PATH = ROOT / "index.html"
STATUS_PATH = ROOT / "data" / "public" / "research_status.json"
EVIDENCE_PATH = ROOT / "evidence" / "health_evidence_summary.json"


def _number(value: object) -> str:
    return f"{int(value or 0):,}"


def _date(value: object) -> str:
    if not value:
        return "Awaiting publication"
    stamp = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    return f"{stamp.day} {stamp.strftime('%B %Y')}"


def expected_fallbacks() -> dict[str, str]:
    status = json.loads(STATUS_PATH.read_text(encoding="utf-8"))
    evidence = json.loads(EVIDENCE_PATH.read_text(encoding="utf-8"))

    coverage = status.get("source_coverage") or {}
    literature = evidence.get("literature") or {}
    cards = evidence.get("evidence_cards") or {}
    review = evidence.get("review_readiness") or {}
    topics = literature.get("topic_counts") or {}
    trials = evidence.get("clinical_trials") or {}

    ready = review.get("conclusion_sensitive_ready_record_count") or 0
    return {
        "registered-sources": _number(coverage.get("registered_sources")),
        "successful-sources": _number(coverage.get("successful_sources")),
        "candidate-evidence-records": _number(literature.get("canonical_records", cards.get("card_count", 0))),
        "conclusion-ready": _number(ready),
        "refresh-date": _date(status.get("generated_at")),
        "literature-source-records": _number(literature.get("input_records")),
        "canonical-candidate-records": _number(literature.get("canonical_records", cards.get("card_count", 0))),
        "clinical-trials-indexed": _number(trials.get("record_count")),
        "provisional-rct-count": _number((cards.get("study_design_counts") or {}).get("randomised_controlled_trial")),
        "human-reviewed-count": _number(review.get("reviewed_record_count")),
        "synthesis-ready-count": _number(ready),
        "respiratory-count": _number(topics.get("respiratory")),
        "cessation-count": _number(topics.get("cessation")),
        "cardiovascular-count": _number(topics.get("cardiovascular")),
        "youth-count": _number(topics.get("youth")),
    }


def render_index(html: str, values: dict[str, str] | None = None) -> str:
    values = values or expected_fallbacks()
    rendered = html
    for element_id, value in values.items():
        pattern = re.compile(
            rf'(<(?:strong|b|span)\b[^>]*\bid="{re.escape(element_id)}"[^>]*>)([^<]*)(</(?:strong|b|span)>)'
        )
        rendered, count = pattern.subn(rf"\g<1>{value}\g<3>", rendered, count=1)
        if count != 1:
            raise ValueError(f"Could not uniquely locate homepage fallback id: {element_id}")
    return rendered


def check_static_fallbacks() -> list[str]:
    if not INDEX_PATH.is_file() or not STATUS_PATH.is_file() or not EVIDENCE_PATH.is_file():
        return ["static fallback validation inputs are missing"]
    current = INDEX_PATH.read_text(encoding="utf-8")
    try:
        expected = render_index(current)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        return [f"static fallback validation failed: {exc}"]
    if current != expected:
        return ["index.html static fallback facts do not match canonical release JSON"]
    return []


def main() -> int:
    current = INDEX_PATH.read_text(encoding="utf-8")
    rendered = render_index(current)
    if current == rendered:
        print("Static homepage fallback facts already match canonical release data.")
        return 0
    INDEX_PATH.write_text(rendered, encoding="utf-8")
    print("Updated static homepage fallback facts from canonical release data.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
