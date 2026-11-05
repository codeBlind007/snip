import asyncio
import json
import os
import sys
import time
from pathlib import Path
from dotenv import load_dotenv

root_path = Path(__file__).resolve().parent.parent
backend_path = root_path / "backend"
load_dotenv(backend_path / ".env")
sys.path.insert(0, str(root_path))
sys.path.insert(0, str(backend_path))

import httpx
from app.db.db import SessionLocal
from app.db.redis import redis_client
from app.models.url import Url
from benchmarks.metrics import run_load_test, calculate_percentiles

BASE_URL = "http://127.0.0.1:8000"
BENCH_SHORT_CODE = "bench_unlimited"
TARGET_LONG_URL = "https://example.com/benchmark-target"
RESULTS_FILE = Path(__file__).resolve().parent / "results.json"
CONCURRENCY_LEVELS = [1, 10, 50, 100]
REQUESTS_PER_LEVEL = 50


def setup_benchmark_url() -> str:
    db = SessionLocal()
    try:
        url = db.query(Url).filter(Url.short_code == BENCH_SHORT_CODE).first()
        if not url:
            url = Url(
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
        else:
            url.is_active = True
            url.max_clicks = None
            url.expire_time = None
            db.commit()
        return f"{BASE_URL}/url/{BENCH_SHORT_CODE}"
    finally:
        db.close()


async def warmup_cache(target_url: str):
    """Sends 1 initial request to populate Redis cache and verifies cache hit."""
    print("[Warmup] Sending warm-up request to populate Redis...")
    async with httpx.AsyncClient() as client:
        r = await client.get(target_url, follow_redirects=False)
        print(f"[Warmup] Response status: {r.status_code}")

    # Check Redis directly
    try:
        key = f"url:{BENCH_SHORT_CODE}"
        cached = redis_client.get(key)
        if cached:
            print(f"[Warmup] SUCCESS: Key '{key}' verified in Redis cache.")
        else:
            print(f"[Warmup] WARNING: Key '{key}' NOT found in Redis.")
    except Exception as e:
        print(f"[Warmup] Redis check failed: {e}")


def measure_redis_lookup_latency(iterations: int = 100):
    """Measures raw Redis GET latency in milliseconds."""
    key = f"url:{BENCH_SHORT_CODE}"
    latencies = []
    try:
        for _ in range(iterations):
            t0 = time.perf_counter()
            _ = redis_client.get(key)
            t1 = time.perf_counter()
            latencies.append((t1 - t0) * 1000.0)
        return calculate_percentiles(latencies)
    except Exception as e:
        print(f"[Redis Lookup] Could not measure direct latency: {e}")
        return None


async def main():
    print("=" * 60)
    print("  PHASE 3: REDIS-ENABLED BENCHMARK")
    print("  Target: Unlimited-Click URL (Redis In-Memory Cache-Aside Path)")
    print("=" * 60)

    target_url = setup_benchmark_url()
    print(f"Target URL: {target_url}")

    # Warm up cache
    await warmup_cache(target_url)

    # Measure direct Redis lookup latency
    direct_redis_stats = measure_redis_lookup_latency(100)
    if direct_redis_stats:
        print(f"[Direct Redis GET Latency] Avg: {direct_redis_stats['avg']:.3f}ms | P50: {direct_redis_stats['p50']:.3f}ms | P95: {direct_redis_stats['p95']:.3f}ms")

    results = {}

    for c in CONCURRENCY_LEVELS:
        print(f"\n>>> Running Redis Benchmark: Concurrency = {c}, Requests = {REQUESTS_PER_LEVEL}...", flush=True)
        res = await run_load_test(
            url=target_url,
            concurrency=c,
            total_requests=REQUESTS_PER_LEVEL,
            is_redis_enabled=True,
        )
        results[f"c_{c}"] = res.to_dict()
        print(f"    Avg: {res.avg_latency_ms:.1f}ms | P50: {res.p50_ms:.1f}ms | P95: {res.p95_ms:.1f}ms | P99: {res.p99_ms:.1f}ms | RPS: {res.rps:.1f} | Statuses: {res.status_codes}", flush=True)

    # Load existing results
    data = {}
    if RESULTS_FILE.exists():
        try:
            with open(RESULTS_FILE, "r") as f:
                data = json.load(f)
        except Exception:
            data = {}

    data["redis"] = results
    if direct_redis_stats:
        data["redis_direct_latency"] = direct_redis_stats

    with open(RESULTS_FILE, "w") as f:
        json.dump(data, f, indent=2)

    print("\n" + "=" * 60)
    print(f"Redis benchmark complete! Results saved to {RESULTS_FILE}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
