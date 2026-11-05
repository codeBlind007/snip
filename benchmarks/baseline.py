import asyncio
import json
import os
import sys
from pathlib import Path

# Add root and backend directory to path
root_path = Path(__file__).resolve().parent.parent
backend_path = root_path / "backend"
sys.path.insert(0, str(root_path))
sys.path.insert(0, str(backend_path))

from app.db.db import SessionLocal
import app.models.url
from benchmarks.metrics import run_load_test

BASE_URL = "http://127.0.0.1:8000"
BENCH_SHORT_CODE = "bench_unlimited"
TARGET_LONG_URL = "https://example.com/benchmark-target"
RESULTS_FILE = Path(__file__).resolve().parent / "results.json"
CONCURRENCY_LEVELS = [1, 10, 50, 100]
REQUESTS_PER_LEVEL = 50  # 50 requests per tier = 200 total requests


def setup_benchmark_url() -> str:
    """Ensures the benchmark URL exists in the database with max_clicks=None."""
    db = SessionLocal()
    try:
        url = db.query(app.models.url.Url).filter(app.models.url.Url.short_code == BENCH_SHORT_CODE).first()
        if not url:
            url = app.models.url.Url(
                idempotency_key="bench-unlimited-key-001",
                short_code=BENCH_SHORT_CODE,
                long_url=TARGET_LONG_URL,
                max_clicks=None,
                click_count=0,
                expire_time=None,
                is_active=True,
                user_id=1,
            )
            db.add(url)
            db.commit()
            print(f"[Setup] Created benchmark URL: {BENCH_SHORT_CODE} -> {TARGET_LONG_URL}")
        else:
            url.is_active = True
            url.max_clicks = None
            url.expire_time = None
            db.commit()
            print(f"[Setup] Re-used existing benchmark URL: {BENCH_SHORT_CODE}")
        return f"{BASE_URL}/url/{BENCH_SHORT_CODE}"
    finally:
        db.close()


async def main():
    print("=" * 60)
    print("  PHASE 1: BASELINE BENCHMARK (WITHOUT REDIS)")
    print("  Target: Unlimited-Click URL (PostgreSQL Direct Path)")
    print("=" * 60)

    target_url = setup_benchmark_url()
    print(f"Target URL: {target_url}")
    print(f"Concurrency tiers: {CONCURRENCY_LEVELS}")
    print(f"Requests per tier: {REQUESTS_PER_LEVEL}")
    print("-" * 60)

    results = {}

    for c in CONCURRENCY_LEVELS:
        print(f"\n>>> Running Baseline Benchmark: Concurrency = {c}, Requests = {REQUESTS_PER_LEVEL}...", flush=True)
        res = await run_load_test(
            url=target_url,
            concurrency=c,
            total_requests=REQUESTS_PER_LEVEL,
            is_redis_enabled=False,
        )
        results[f"c_{c}"] = res.to_dict()
        print(f"    Avg: {res.avg_latency_ms:.1f}ms | P50: {res.p50_ms:.1f}ms | P95: {res.p95_ms:.1f}ms | P99: {res.p99_ms:.1f}ms | RPS: {res.rps:.1f} | Statuses: {res.status_codes}", flush=True)

    # Load existing results if present
    data = {}
    if RESULTS_FILE.exists():
        try:
            with open(RESULTS_FILE, "r") as f:
                data = json.load(f)
        except Exception:
            data = {}

    data["baseline"] = results
    with open(RESULTS_FILE, "w") as f:
        json.dump(data, f, indent=2)

    print("\n" + "=" * 60)
    print(f"Baseline benchmark complete! Results saved to {RESULTS_FILE}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
