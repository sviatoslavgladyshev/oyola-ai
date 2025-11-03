import os
import random
import time
from dataclasses import dataclass
from typing import Optional


@dataclass
class ProxyEndpoint:
    url: str
    score: float = 1.0  # health score [0,1]
    cooldown_until: float = 0.0


class ProxyPool:
    def __init__(self, base_proxy_url: Optional[str]) -> None:
        # For residential proxy providers, one gateway is enough; rotation is per-request
        self.base_proxy_url = base_proxy_url
        # If provider supports multiple gateways, list could be extended here
        self.endpoints: list[ProxyEndpoint] = (
            [ProxyEndpoint(base_proxy_url)] if base_proxy_url else []
        )

    def mark_success(self, endpoint: ProxyEndpoint) -> None:
        endpoint.score = min(1.0, endpoint.score + 0.05)

    def mark_failure(self, endpoint: ProxyEndpoint) -> None:
        endpoint.score = max(0.0, endpoint.score - 0.2)
        # brief cooldown to avoid hammering possibly bad exit
        endpoint.cooldown_until = time.time() + random.uniform(5, 20)

    def select_proxy(self) -> Optional[str]:
        now = time.time()
        available = [e for e in self.endpoints if e.cooldown_until <= now and e.score > 0.05]
        if not available:
            # Fallback to base even if cooling down
            return self.base_proxy_url
        # Weighted random by score to prefer healthy endpoints
        weights = [max(0.01, e.score) for e in available]
        choice = random.choices(available, weights=weights, k=1)[0]
        return choice.url


def build_proxy_pool() -> ProxyPool:
    return ProxyPool(os.getenv("PROXY_URL"))


