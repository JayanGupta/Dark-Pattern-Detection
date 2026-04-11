"""
Web Page Scraper.

Extracts HTML content from a URL using httpx + BeautifulSoup.
"""

import asyncio
from typing import Optional

import httpx

# Rotate user agents to reduce blocking
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]

_ua_index = 0


def _get_user_agent() -> str:
    """Rotate through user agents."""
    global _ua_index
    ua = USER_AGENTS[_ua_index % len(USER_AGENTS)]
    _ua_index += 1
    return ua


async def scrape_url(url: str, timeout: float = 15.0) -> str:
    """
    Fetch HTML content from a URL.
    
    Args:
        url: The URL to scrape.
        timeout: Request timeout in seconds.
        
    Returns:
        Raw HTML string.
        
    Raises:
        httpx.HTTPError: If the request fails.
        ValueError: If the URL is invalid or unreachable.
    """
    headers = {
        "User-Agent": _get_user_agent(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive",
    }

    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(timeout),
            follow_redirects=True,
            max_redirects=5,
        ) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.text
    except httpx.TimeoutException:
        raise ValueError(f"Request timed out after {timeout}s: {url}")
    except httpx.HTTPStatusError as e:
        raise ValueError(f"HTTP {e.response.status_code} error fetching {url}")
    except httpx.RequestError as e:
        raise ValueError(f"Failed to fetch URL: {e}")


def scrape_url_sync(url: str, timeout: float = 15.0) -> str:
    """Synchronous wrapper for scrape_url."""
    return asyncio.run(scrape_url(url, timeout))
