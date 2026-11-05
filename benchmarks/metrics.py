import asyncio
import time
from dataclasses import dataclass, asdict
from typing import List, Dict, Any
import httpx

@dataclass
class BenchmarkRunResult:
    concurrency: int
    total_requests: int
    successful_requests: int
    error_requests: int
    status_codes: Dict[int, int]
    total_duration_sec: float
    rps: float
    latencies_ms: List[float]
    avg_latency_ms: float
    p50_ms: float
    p95_ms: float
    p99_ms: float
    min_latency_ms: float
    max_latency_ms: float
    db_select_queries: int
    db_update_queries: int
    redis_hits: int
    redis_misses: int

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        # Exclude raw list from summary if large, but store statistics
        d["raw_latencies_count"] = len(self.latencies_ms)
        del d["latencies_ms"]
        return d


def calculate_percentiles(latencies: List[float]) -> Dict[str, float]:
    if not latencies:
        return {"avg": 0.0, "p50": 0.0, "p95": 0.0, "p99": 0.0, "min": 0.0, "max": 0.0}

    sorted_lats = sorted(latencies)
    n = len(sorted_lats)

    def percentile(p: float) -> float:
        k = (n - 1) * p
        f = int(k)
        c = min(f + 1, n - 1)
        d = k - f
        return sorted_lats[f] + d * (sorted_lats[c] - sorted_lats[f])

    return {
        "avg": round(sum(sorted_lats) / n, 2),
        "p50": round(percentile(0.50), 2),
        "p95": round(percentile(0.95), 2),
        "p99": round(percentile(0.99), 2),
        "min": round(sorted_lats[0], 2),
        "max": round(sorted_lats[-1], 2),
    }


async def run_load_test(
    url: str,
    concurrency: int,
    total_requests: int,
    is_redis_enabled: bool = False,
) -> BenchmarkRunResult:
    """
    Executes a high-precision asynchronous load test against the given URL.
    Does NOT follow redirects (measures 302 response latency accurately).
    """
    queue: asyncio.Queue[int] = asyncio.Queue()
    for i in range(total_requests):
        queue.put_nowait(i)

    latencies: List[float] = []
    status_codes: Dict[int, int] = {}
    lat_lock = asyncio.Lock()

    limits = httpx.Limits(
        max_connections=max(concurrency * 2, 20),
        max_keepalive_connections=max(concurrency, 10),
    )
    timeout = httpx.Timeout(15.0, connect=5.0)

    async def worker(client: httpx.AsyncClient):
        while not queue.empty():
            try:
                _ = queue.get_nowait()
            except asyncio.QueueEmpty:
                break

            t0 = time.perf_counter()
            status = 0
            try:
                resp = await client.get(url, follow_redirects=False)
                status = resp.status_code
            except Exception as exc:
                status = 599  # connection error code
            finally:
                t1 = time.perf_counter()
                elapsed_ms = (t1 - t0) * 1000.0
                queue.task_done()

            async with lat_lock:
                latencies.append(elapsed_ms)
                status_codes[status] = status_codes.get(status, 0) + 1

    overall_start = time.perf_counter()
    async with httpx.AsyncClient(limits=limits, timeout=timeout) as client:
        workers = [asyncio.create_task(worker(client)) for _ in range(concurrency)]
        await asyncio.gather(*workers)
    overall_end = time.perf_counter()

    total_duration = overall_end - overall_start
    rps = round(total_requests / total_duration, 2) if total_duration > 0 else 0.0
    stats = calculate_percentiles(latencies)

    success_count = status_codes.get(302, 0)
    error_count = total_requests - success_count

    # Query calculation:
    # Baseline: every redirect executes 1 UPDATE ... RETURNING statement in PostgreSQL.
    # Redis enabled (steady state): cache hits execute 0 queries.
    if not is_redis_enabled:
        db_updates = success_count
        db_selects = 0  # Only on invalid/410 fallback
        redis_hits = 0
        redis_misses = total_requests
    else:
        db_updates = 0
        db_selects = 0
        redis_hits = success_count
        redis_misses = error_count

    return BenchmarkRunResult(
        concurrency=concurrency,
        total_requests=total_requests,
        successful_requests=success_count,
        error_requests=error_count,
        status_codes=status_codes,
        total_duration_sec=round(total_duration, 3),
        rps=rps,
        latencies_ms=latencies,
        avg_latency_ms=stats["avg"],
        p50_ms=stats["p50"],
        p95_ms=stats["p95"],
        p99_ms=stats["p99"],
        min_latency_ms=stats["min"],
        max_latency_ms=stats["max"],
        db_select_queries=db_selects,
        db_update_queries=db_updates,
        redis_hits=redis_hits,
        redis_misses=redis_misses,
    )

