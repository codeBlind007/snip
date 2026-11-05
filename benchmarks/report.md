# Benchmark Report: URL Shortener Performance (PostgreSQL Baseline vs. Redis Hybrid Cache)

**Author:** Senior Backend Performance Engineering  
**Target Service:** FastAPI URL Shortener (`GET /url/{short_code}`)  
**Date:** November 2026  
**Status:** Complete & Verified with Monotonic Timers (`time.perf_counter`)  

## Executive Summary
This benchmark quantifies the real-world performance gain of introducing a Redis cache-aside layer for high-traffic, unlimited-click URLs in front of a PostgreSQL database. Under single-user execution ($C=1$), average redirect latency fell from **1138.78 ms to 5.08 ms (+99.6%)**, increasing throughput from **0.87 RPS to 102.95 RPS (+11733.3%)**. Under moderate concurrency ($C=10$), average latency plummeted from **1986.14 ms to 51.87 ms (+97.4%)**, boosting throughput from **4.54 RPS to 97.92 RPS (+2056.8%)**. Database query load on cached steady-state reads was reduced by **100%**, while atomic conditional PostgreSQL updates for capped URLs preserved absolute invariant correctness under concurrent bursts.

---

## A. Environment & Hardware Specifications

| Specification | Configuration Details |
| :--- | :--- |
| **Operating System** | Windows 11 (Build 10.0.26300 AMD64) / WSL2 Linux 6.18 |
| **CPU** | AMD64 16 Logical Processors (Family 25 Model 68) |
| **System RAM** | 8.0 GB RAM |
| **Python Version** | Python 3.13.5 (64-bit) |
| **FastAPI Version** | FastAPI 0.156.8 + Starlette |
| **Application Workers** | 1 Uvicorn Worker (`app.main:app --reload`) |
| **PostgreSQL Version** | PostgreSQL 17.11 (Supabase AWS AP-Southeast-1, SSL Required) |
| **Database Pool Mode** | SQLAlchemy QueuePool (`pool_size=20`, `max_overflow=80`, `pool_timeout=60s`) |
| **Connection Pooler** | PgBouncer Transaction Pooler (Port 6543) |
| **Redis Version** | Redis 8.10.3 on Linux WSL2 (`redis-py` client) |

---

## B. Performance Comparison (Without Redis vs. With Redis)

### Primary Comparison Table (Steady-State at Concurrency = 10, 50 Requests)

| Metric | Without Redis (PostgreSQL) | With Redis (In-Memory) | Improvement |
| :--- | ---: | ---: | ---: |
| **Average Latency** | `1986.14 ms` | `51.87 ms` | **+97.4%** |
| **P50 Latency** | `1722.89 ms` | `44.29 ms` | **+97.4%** |
| **P95 Latency** | `4164.52 ms` | `110.66 ms` | **+97.3%** |
| **P99 Latency** | `5946.37 ms` | `156.46 ms` | **+97.4%** |
| **Throughput (RPS)** | `4.54 req/s` | `97.92 req/s` | **+2056.8%** |
| **PostgreSQL SELECT queries** | `0` | `0` | **0.0%** |
| **PostgreSQL UPDATE queries** | `50` | `0` | **+100.0%** |
| **HTTP 302 Success Rate** | `100.0% (50/50)` | `100.0% (50/50)` | **Parity** |

### Comprehensive Breakdown Across All Tested Concurrency Levels

#### Concurrency Level: 1 Concurrent Users (50 requests)
| Metric | Without Redis (PostgreSQL) | With Redis (In-Memory) | Improvement |
| :--- | ---: | ---: | ---: |
| **Average Latency** | `1138.78 ms` | `5.08 ms` | **+99.6%** |
| **P50 Latency** | `1013.46 ms` | `4.99 ms` | **+99.5%** |
| **P95 Latency** | `2374.32 ms` | `5.51 ms` | **+99.8%** |
| **P99 Latency** | `4012.54 ms` | `7.25 ms` | **+99.8%** |
| **Throughput (RPS)** | `0.87 req/s` | `102.95 req/s` | **+11733.3%** |
| **PostgreSQL SELECT queries** | `0` | `0` | **0.0%** |
| **PostgreSQL UPDATE queries** | `50` | `0` | **+100.0%** |
| **Successful 302 Redirects** | `50/50 (100.0%)` | `50/50 (100.0%)` | **0.0%** |

#### Concurrency Level: 10 Concurrent Users (50 requests)
| Metric | Without Redis (PostgreSQL) | With Redis (In-Memory) | Improvement |
| :--- | ---: | ---: | ---: |
| **Average Latency** | `1986.14 ms` | `51.87 ms` | **+97.4%** |
| **P50 Latency** | `1722.89 ms` | `44.29 ms` | **+97.4%** |
| **P95 Latency** | `4164.52 ms` | `110.66 ms` | **+97.3%** |
| **P99 Latency** | `5946.37 ms` | `156.46 ms` | **+97.4%** |
| **Throughput (RPS)** | `4.54 req/s` | `97.92 req/s` | **+2056.8%** |
| **PostgreSQL SELECT queries** | `0` | `0` | **0.0%** |
| **PostgreSQL UPDATE queries** | `50` | `0` | **+100.0%** |
| **Successful 302 Redirects** | `50/50 (100.0%)` | `50/50 (100.0%)` | **0.0%** |

#### Concurrency Level: 50 Concurrent Users (50 requests)
| Metric | Without Redis (PostgreSQL) | With Redis (In-Memory) | Improvement |
| :--- | ---: | ---: | ---: |
| **Average Latency** | `10116.57 ms` | `305.17 ms` | **+97.0%** |
| **P50 Latency** | `11015.43 ms` | `155.14 ms` | **+98.6%** |
| **P95 Latency** | `15127.55 ms` | `1666.42 ms` | **+89.0%** |
| **P99 Latency** | `15145.71 ms` | `2114.93 ms` | **+86.0%** |
| **Throughput (RPS)** | `3.24 req/s` | `19.84 req/s` | **+512.3%** |
| **PostgreSQL SELECT queries** | `0` | `0` | **0.0%** |
| **PostgreSQL UPDATE queries** | `37` | `0` | **+100.0%** |
| **Successful 302 Redirects** | `37/50 (74.0%)` | `50/50 (100.0%)` | **+26.0%** |

#### Concurrency Level: 100 Concurrent Users (50 requests)
| Metric | Without Redis (PostgreSQL) | With Redis (In-Memory) | Improvement |
| :--- | ---: | ---: | ---: |
| **Average Latency** | `12659.26 ms` | `440.91 ms` | **+96.5%** |
| **P50 Latency** | `15101.33 ms` | `161.06 ms` | **+98.9%** |
| **P95 Latency** | `15138.21 ms` | `2355.25 ms` | **+84.4%** |
| **P99 Latency** | `15162.14 ms` | `2740.88 ms` | **+81.9%** |
| **Throughput (RPS)** | `3.24 req/s` | `16.0 req/s` | **+393.8%** |
| **PostgreSQL SELECT queries** | `0` | `0` | **0.0%** |
| **PostgreSQL UPDATE queries** | `22` | `0` | **+100.0%** |
| **Successful 302 Redirects** | `22/50 (44.0%)` | `50/50 (100.0%)` | **+56.0%** |

## C. Redis In-Memory Cache Statistics

| Metric | Measured Value |
| :--- | :--- |
| **Steady-State Cache Hits** | `50` requests |
| **Steady-State Cache Misses** | `0` requests |
| **Steady-State Cache Hit Ratio** | `100.0%` (Warm cache) |
| **Direct Redis GET Latency (Avg)** | `0.34 ms` |
| **Direct Redis GET Latency (P50)** | `0.32 ms` |
| **Direct Redis GET Latency (P95)** | `0.41 ms` |
| **Direct Redis GET Latency (P99)** | `0.45 ms` |
| **Direct Redis GET Min / Max** | `0.27 ms / 0.45 ms` |

---

## D. Concurrency & Click-Limit Invariant Correctness

Performance optimizations must never compromise correctness. Atomic conditional PostgreSQL `UPDATE urls SET click_count = click_count + 1 WHERE click_count < max_clicks RETURNING id` was evaluated under heavy concurrent load bursts:

| Test Scenario | Total Burst | HTTP 302 (Redirect) | HTTP 410 (Gone) | Expected DB Count | Final DB Count | Invariant Status |
| :--- | ---: | ---: | ---: | ---: | ---: | :--- |
| **One-Time URL (`max_clicks=1`)** | `100` | `1` | `99` | `1` | `1` | **PASS (Zero Race Conditions)** |
| **Capped URL (`max_clicks=10`)** | `100` | `10` | `90` | `10` | `10` | **PASS (Zero Race Conditions)** |

### Invariant Enforcement Proof:
1. **Single-Use URL (`max_clicks=1`)**: Under 100 simultaneous concurrent requests, exactly 1 request acquired row-level lock and executed the 302 redirect. The remaining 99 requests immediately evaluated the atomic `WHERE click_count < max_clicks` predicate to false, returning HTTP 410 Gone. **Zero duplicate redirects occurred**.
2. **Multi-Use URL (`max_clicks=10`)**: Out of 100 concurrent requests, exactly 10 requests were granted 302 redirects, and 90 requests were rejected with HTTP 410. Final database state was exactly `click_count = 10`.
3. **Absence of Eventual Consistency Drift**: The hybrid caching architecture deliberately bypasses Redis for click-limited URLs, enforcing immediate consistency directly in PostgreSQL and guaranteeing zero quota leakage.

---

## E. Performance Findings & Engineering Observations

### 1. Latency Improvement
- Under single concurrency ($C=1$), average redirect latency fell from **1,138.8 ms to 5.08 ms (+99.6% reduction)**.
- Under $C=10$, latency decreased from **1,986.1 ms to 51.87 ms (+97.4% reduction)**.
- At $C=100$, average latency dropped from **12,659.3 ms to 440.91 ms (+96.5% reduction)**, preventing catastrophic queuing.
### 2. Database Read & Write Load Reduction
- For steady-state cached redirects, PostgreSQL operations decreased by **100.0%** (0 database queries executed vs. 50 row updates per batch in baseline).
- Bypassing the database completely eliminates roundtrips across international networks (local client to Supabase in Singapore) and prevents write-ahead log (WAL) churn on high-frequency link lookups.
### 3. Throughput Scaling & Reliability
- Throughput increased by **+11,733.3%** at $C=1$ (from 0.87 req/s to 102.95 req/s) and by **+2,056.8%** at $C=10$ (from 4.54 req/s to 97.92 req/s).
- **Error Elimination**: In the baseline without Redis, high concurrency caused connection pool exhaustion, leading to **26% timeouts at C=50** and **56% timeouts at C=100**. With Redis enabled, **100% of requests succeeded (0 timeouts)** across all concurrency tiers.
### 4. Redis Bottleneck Analysis
- Raw Redis GET latency measured an average of **0.34 ms** (P95: 0.41 ms), demonstrating that Redis is not the bottleneck.
- Total request turnaround was bounded solely by ASGI HTTP processing and client-side keepalive connection pooling.
### 5. Observed System Limitations
- **Worker Concurrency Limit**: The application was run with a single Uvicorn worker process. When concurrency escalated to $C=100$, the single-threaded event loop queued requests, increasing P95 latency to 2,355 ms. Adding multiple Uvicorn workers (`uvicorn --workers 4`) would eliminate this event loop queue.
- **Cache Stampede Prevention**: When a cached key expires after its 1-hour TTL, initial simultaneous hits will fall back to PostgreSQL. Implementing a brief mutex or probabilistic early expiration (XFetch) will protect against stampedes during flash traffic.

---

## F. Resume-Ready Technical Achievements

- **Architected and benchmarked a hybrid cache-aside URL redirection engine** using FastAPI, Redis, and PostgreSQL, achieving a **+97.4% reduction in redirect latency** (from 1,986.1 ms to 51.9 ms) and a **+2,056.8% increase in throughput** under concurrent load.
- **Eliminated 100% of database write churn on steady-state reads** by caching high-frequency URL metadata in Redis with automated TTL expiration, reducing database roundtrips from 50 to 0 per test batch.
- **Guaranteed zero-leak click quota invariants** using atomic conditional PostgreSQL updates (`WHERE click_count < max_clicks RETURNING`), provably enforcing exactly 1/1 and 10/10 redirect allocations under 100 concurrent requests without race conditions or eventual consistency drift.
- **Constructed an automated asynchronous benchmarking framework** in Python (`httpx`, `asyncio`, monotonic timers) measuring P50/P95/P99 latency profiles across 1–100 concurrent users and capturing connection pool exhaustion thresholds.