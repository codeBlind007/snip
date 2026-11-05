import asyncio
import json
import os
import sys
import time
from pathlib import Path
from typing import Dict, Any
import httpx

root_path = Path(__file__).resolve().parent.parent
backend_path = root_path / "backend"
sys.path.insert(0, str(root_path))
sys.path.insert(0, str(backend_path))

from app.db.db import SessionLocal
from app.models.url import Url

BASE_URL = "http://127.0.0.1:8000"
RESULTS_FILE = Path(__file__).resolve().parent / "results.json"


def create_capped_url(short_code: str, max_clicks: int) -> str:
    db = SessionLocal()
    try:
        # Delete if already exists
        existing = db.query(Url).filter(Url.short_code == short_code).first()
        if existing:
            db.delete(existing)
            db.commit()

        url = Url(
            idempotency_key=f"bench-key-{short_code}",
            short_code=short_code,
            long_url=f"https://example.com/target-{short_code}",
            max_clicks=max_clicks,
            click_count=0,
            expire_time=None,
            is_active=True,
            user_id=1,
        )
        db.add(url)
        db.commit()
        db.refresh(url)
        return f"{BASE_URL}/url/{short_code}"
    finally:
        db.close()


def get_final_click_count(short_code: str) -> int:
    db = SessionLocal()
    try:
        url = db.query(Url).filter(Url.short_code == short_code).first()
        return url.click_count if url else -1
    finally:
        db.close()


async def send_concurrent_burst(target_url: str, total_burst: int = 100) -> Dict[str, Any]:
    limits = httpx.Limits(max_connections=total_burst, max_keepalive_connections=total_burst)
    timeout = httpx.Timeout(45.0, connect=15.0)

    # Use a barrier / sync point so all 100 requests trigger as simultaneously as possible
    ready_event = asyncio.Event()
    results = []

    async def single_request(client: httpx.AsyncClient, req_id: int):
        await ready_event.wait()
        t0 = time.perf_counter()
        status = 0
        try:
            r = await client.get(target_url, follow_redirects=False)
            status = r.status_code
        except Exception:
            status = 599
        t1 = time.perf_counter()
        results.append((status, (t1 - t0) * 1000.0))

    async with httpx.AsyncClient(limits=limits, timeout=timeout) as client:
        tasks = [asyncio.create_task(single_request(client, i)) for i in range(total_burst)]
        # Allow all tasks to spin up and wait
        await asyncio.sleep(0.2)
        # Release barrier
        ready_event.set()
        await asyncio.gather(*tasks)

    status_dist = {}
    for st, _ in results:
        status_dist[st] = status_dist.get(st, 0) + 1

    return {
        "total_requests": total_burst,
        "status_distribution": status_dist,
        "redirect_302_count": status_dist.get(302, 0),
        "gone_410_count": status_dist.get(410, 0),
        "other_count": sum(c for s, c in status_dist.items() if s not in (302, 410)),
    }


async def test_case_max_clicks_1():
    short_code = "bench_cap_1"
    url = create_capped_url(short_code, max_clicks=1)
    print(f"\n[Test 1] Bombarding {url} (max_clicks=1) with 100 concurrent requests...")

    burst_res = await send_concurrent_burst(url, total_burst=100)
    final_count = get_final_click_count(short_code)

    is_correct = (
        burst_res["redirect_302_count"] == 1
        and burst_res["gone_410_count"] == 99
        and final_count == 1
    )

    burst_res["expected_302"] = 1
    burst_res["expected_410"] = 99
    burst_res["final_db_click_count"] = final_count
    burst_res["passed"] = is_correct

    print(f"    Expected: 1 x 302, 99 x 410, click_count=1")
    print(f"    Actual:   {burst_res['redirect_302_count']} x 302, {burst_res['gone_410_count']} x 410, click_count={final_count}")
    print(f"    Status:   {'PASSED [INVARIANT ENFORCED]' if is_correct else 'FAILED'}")
    return burst_res


async def test_case_max_clicks_10():
    short_code = "bench_cap_10"
    url = create_capped_url(short_code, max_clicks=10)
    print(f"\n[Test 2] Bombarding {url} (max_clicks=10) with 100 concurrent requests...")

    burst_res = await send_concurrent_burst(url, total_burst=100)
    final_count = get_final_click_count(short_code)

    is_correct = (
        burst_res["redirect_302_count"] == 10
        and burst_res["gone_410_count"] == 90
        and final_count == 10
    )

    burst_res["expected_302"] = 10
    burst_res["expected_410"] = 90
    burst_res["final_db_click_count"] = final_count
    burst_res["passed"] = is_correct

    print(f"    Expected: 10 x 302, 90 x 410, click_count=10")
    print(f"    Actual:   {burst_res['redirect_302_count']} x 302, {burst_res['gone_410_count']} x 410, click_count={final_count}")
    print(f"    Status:   {'PASSED [INVARIANT ENFORCED]' if is_correct else 'FAILED'}")
    return burst_res


async def main():
    print("=" * 60)
    print("  PHASE 2: CONCURRENCY CORRECTNESS & INVARIANT VERIFICATION")
    print("  Testing atomic conditional PostgreSQL updates under concurrency")
    print("=" * 60)

    res_1 = await test_case_max_clicks_1()
    res_10 = await test_case_max_clicks_10()

    # Load existing results
    data = {}
    if RESULTS_FILE.exists():
        try:
            with open(RESULTS_FILE, "r") as f:
                data = json.load(f)
        except Exception:
            data = {}

    data["correctness"] = {
        "max_clicks_1": res_1,
        "max_clicks_10": res_10,
    }

    with open(RESULTS_FILE, "w") as f:
        json.dump(data, f, indent=2)

    print("\n" + "=" * 60)
    print(f"Concurrency correctness tests complete! Results saved to {RESULTS_FILE}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
