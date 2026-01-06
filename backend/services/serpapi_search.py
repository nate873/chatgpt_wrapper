import os
import requests
from urllib.parse import urlparse

SERPAPI_URL = "https://serpapi.com/search"

def search_local_lenders(city: str, state: str, num: int = 20):
    api_key = os.getenv("SERPAPI_KEY")
    if not api_key:
        raise RuntimeError("Missing SERPAPI_KEY")

    params = {
        "engine": "google_maps",
        "q": f"hard money lender {city} {state}",
        "type": "search",
        "api_key": api_key,
    }

    r = requests.get(SERPAPI_URL, params=params, timeout=15)
    r.raise_for_status()
    data = r.json()

    lenders = []

    for item in data.get("local_results", []):
        name = item.get("title")
        website = (
            item.get("website")
            or item.get("links", {}).get("website")
            or item.get("link")  # Google Maps profile fallback
        )

        if not name:
            continue

        lenders.append({
            "name": name,
            "website": website or "",  # allow empty
            "rating": item.get("rating"),
            "reviews": item.get("reviews"),
            "address": item.get("address"),
            "phone": item.get("phone"),
            "source": "serpapi_maps",
        })

    return lenders[:num]

def normalize_lenders(lenders):
    seen = set()
    cleaned = []

    for lender in lenders:
        # Use best available unique identifier
        key = (
            lender.get("website")
            or lender.get("phone")
            or lender.get("name", "").lower()
        )

        if not key or key in seen:
            continue

        seen.add(key)
        cleaned.append(lender)

    return cleaned
