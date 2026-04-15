"""
Web Page Scraper

Downloads the HTML content from a URL so we can analyze it.
Uses httpx (an async HTTP library) with fake browser headers
to avoid being blocked by websites.
"""

import asyncio
import httpx

# Pretend to be a real browser so websites don't block us
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]

_ua_index = 0


def _get_user_agent():
    """Cycle through different user agent strings to avoid detection."""
    global _ua_index
    ua = USER_AGENTS[_ua_index % len(USER_AGENTS)]
    _ua_index += 1
    return ua


async def scrape_url(url, timeout=15.0):
    """
    Download the HTML from a URL.

    Args:
        url:     The web page URL to scrape
        timeout: How long to wait before giving up (seconds)

    Returns:
        The raw HTML as a string

    Raises:
        ValueError: If the URL is invalid or the request fails
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
            response.raise_for_status()  # Raise error for 4xx/5xx status codes
            return response.text

    except httpx.TimeoutException:
        raise ValueError(f"Request timed out after {timeout}s: {url}")
    except httpx.HTTPStatusError as e:
        raise ValueError(f"HTTP {e.response.status_code} error fetching {url}")
    except httpx.RequestError as e:
        raise ValueError(f"Failed to fetch URL: {e}")


def scrape_url_sync(url, timeout=15.0):
    """Same as scrape_url but synchronous (blocking). For non-async code."""
    return asyncio.run(scrape_url(url, timeout))
