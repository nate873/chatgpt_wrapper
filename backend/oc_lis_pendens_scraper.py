import asyncio
import csv
import os
import re
import time
from datetime import datetime, timedelta

import requests
from dotenv import load_dotenv
from playwright.async_api import async_playwright

load_dotenv()

SUPABASE_URL  = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY  = os.getenv("SUPABASE_KEY", "")
OC_SEARCH_URL = "https://selfservice.or.occompt.com/ssweb/search/DOCSEARCH2950S3"
OCPA_SEARCH   = "https://ocpaweb.ocpafl.org/parcelsearch/Parcels"
OCPA_DETAIL   = "https://www.ocpafl.org/searches/parcel_search.aspx?strap="
OUTPUT_CSV    = f"oc_lis_pendens_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"


async def scrape_lis_pendens() -> list[dict]:
    print("\n" + "="*60)
    print("  FlipBot - OC Lis Pendens Scraper")
    print("="*60)

    records = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            args=["--no-sandbox"]
        )
        ctx = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0 Safari/537.36"
            )
        )
        page = await ctx.new_page()

        print("  -> Opening portal...")
        await page.goto(OC_SEARCH_URL, wait_until="domcontentloaded", timeout=30_000)
        await page.wait_for_timeout(2_000)

        # ── Step 1: Wait for user to solve CAPTCHA + accept disclaimer ─────
        if "disclaimer" in page.url:
            print("\n" + "="*60)
            print("  ACTION NEEDED: Solve the CAPTCHA in the browser,")
            print("  then click 'I Accept'.")
            print("  Waiting up to 3 minutes...")
            print("="*60)
            for _ in range(180):
                await page.wait_for_timeout(1_000)
                if "disclaimer" not in page.url:
                    print("  -> Disclaimer passed!")
                    break
            else:
                print("  -> Timed out. Please restart.")
                await browser.close()
                return []

        # ── Step 2: Wait for user to fill search form and submit ───────────
        print("\n" + "="*60)
        print("  ACTION NEEDED: Fill in the date range and any filters,")
        print("  then click Search.")
        print("  Waiting for results page to load...")
        print("="*60)

        # Wait until the URL contains 'result' or page contains doc numbers
        for _ in range(180):
            await page.wait_for_timeout(1_000)
            current_url = page.url
            html = await page.content()
            # Results page detected when doc numbers appear on screen
            if re.search(r'\b202\d{8}\b', html):
                print("  -> Results detected! Starting scrape...")
                break
        else:
            print("  -> Timed out waiting for results. Please restart.")
            await browser.close()
            return []

        # ── Step 3: Scrape all pages ───────────────────────────────────────
        page_num  = 1
        seen_docs: set[str] = set()

        while True:
            await page.wait_for_load_state("domcontentloaded")
            await page.wait_for_timeout(2_000)

            html = await page.content()
            page_records = parse_results_page(html)

            new_records = [r for r in page_records if r["doc_number"] not in seen_docs]
            for r in new_records:
                seen_docs.add(r["doc_number"])
            records.extend(new_records)

            print(f"  -> Page {page_num}: {len(new_records)} new records (total: {len(records)})")

            if not page_records:
                print("  -> No records found, stopping.")
                break

            # Click next page
            next_clicked = False
            for sel in [
                "a[title='Go to next page']",
                "a[aria-label='Go to next page']",
                "button[aria-label='Go to next page']",
                "li.next > a",
                "a.next",
                "a:has-text('Next')",
                "button:has-text('Next')",
                "a:has-text('>')",
                "button[title='Next']",
                "a[title='Next']",
            ]:
                try:
                    el = page.locator(sel).first
                    if await el.is_visible(timeout=2_000):
                        is_disabled   = await el.get_attribute("disabled")
                        aria_disabled = await el.get_attribute("aria-disabled")
                        cls = await el.get_attribute("class") or ""
                        if is_disabled or aria_disabled == "true" or "disabled" in cls:
                            print("  -> Last page reached.")
                            break
                        await el.click()
                        next_clicked = True
                        page_num += 1
                        print(f"  -> Navigated to page {page_num}")
                        break
                except Exception:
                    continue

            if not next_clicked:
                print("  -> No next button, done.")
                break

        await browser.close()

    print(f"\n  Done scraping: {len(records)} total records")
    return records


# ── PARSE HTML ─────────────────────────────────────────────────────────────────

def parse_results_page(html: str) -> list[dict]:
    try:
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, "html.parser")
        records = []

        card_selectors = [
            {"class": re.compile(r"search-result|result-item|document-result|record-row", re.I)},
            {"class": re.compile(r"ss-result|ssweb-result|result-card", re.I)},
            {"data-id": True},
            {"class": re.compile(r"item|row|entry", re.I)},
        ]

        cards = []
        for selector in card_selectors:
            found = soup.find_all(["div", "li", "tr", "article"], attrs=selector)
            if found:
                valid = [c for c in found if re.search(r'\b202\d{8}\b', c.get_text())]
                if valid:
                    cards = valid
                    break

        if not cards:
            for tag in ["h3", "h4", "h2", "strong", "b", "span", "div", "a"]:
                els = soup.find_all(tag, string=re.compile(r'^\s*202\d{8}\s*$'))
                if els:
                    for el in els:
                        parent = el.find_parent(["div", "li", "article", "section", "tr"])
                        if parent and parent not in cards:
                            cards.append(parent)
                    if cards:
                        break

        if not cards:
            header_pattern = re.compile(r'202\d{8}\s*[•·]\s*Lis Pendens\s*[•·]\s*\d{2}/\d{2}/\d{4}')
            for el in soup.find_all(string=header_pattern):
                parent = el.find_parent(["div", "li", "article", "section"])
                if parent and parent not in cards:
                    cards.append(parent)

        if cards:
            for card in cards:
                rec = extract_fields(card.get_text("\n", strip=True))
                if rec:
                    records.append(rec)
        else:
            full_text = soup.get_text("\n", strip=True)
            for chunk in re.split(r'(?=\b202\d{8}\b)', full_text):
                if chunk.strip():
                    rec = extract_fields(chunk)
                    if rec:
                        records.append(rec)

        return records

    except Exception as e:
        print(f"  Parse error: {e}")
        return []


def extract_fields(block: str) -> dict | None:
    doc_match = re.search(r'\b(202\d{8})\b', block)
    if not doc_match:
        return None
    doc_number = doc_match.group(1)

    date_match = re.search(r'(\d{2}/\d{2}/\d{4})\s+(\d{1,2}:\d{2}\s*(?:AM|PM))', block, re.I)
    recorded_date = date_match.group(1) if date_match else ""
    recorded_time = date_match.group(2).strip().upper() if date_match else ""

    grantor = ""
    m = re.search(r'Grantor\s*(?:\(\d+\))?\s*\n(.*?)(?=\nGrantee|\nLegal|\Z)', block, re.I | re.S)
    if m:
        grantor = " | ".join(ln.strip() for ln in m.group(1).strip().splitlines() if ln.strip())[:300]

    grantees = []
    m = re.search(r'Grantee\s*(?:\(\d+\))?\s*\n(.*?)(?=\nLegal|\Z)', block, re.I | re.S)
    if m:
        grantees = [ln.strip() for ln in m.group(1).strip().splitlines() if ln.strip()]

    legal = ""
    m = re.search(r'Legal\s*\n(.+?)(?=\n\n|\Z)', block, re.I | re.S)
    if m:
        legal = m.group(1).strip()[:300]
    else:
        m = re.search(r'Legal\s+(.*?)$', block, re.I | re.M)
        if m:
            legal = m.group(1).strip()[:300]

    if not grantees and not grantor and not legal:
        return None

    return {
        "doc_number":    doc_number,
        "recorded_date": recorded_date,
        "recorded_time": recorded_time,
        "doc_type":      "Lis Pendens",
        "grantor":       grantor,
        "grantees":      " | ".join(grantees),
        "legal":         legal,
        "county":        "Orange",
        "state":         "FL",
        "address":       "",
        "city":          "",
        "zip":           "",
        "parcel_id":     "",
        "just_value":    "",
        "sqft":          "",
        "year_built":    "",
        "property_use":  "",
        "ocpa_url":      "",
        "needs_review":  False,
    }


# ── OCPA LOOKUP ────────────────────────────────────────────────────────────────

def enrich_with_ocpa(records: list[dict]) -> list[dict]:
    print(f"\n{'='*60}")
    print(f"  OCPA Address Lookup ({len(records)} records)")
    print(f"{'='*60}")
    for i, rec in enumerate(records):
        name = rec.get("grantees", "") or rec.get("grantor", "")
        name = name.split("|")[0].strip()
        name = re.sub(r'\b(ET AL|ET UX|ET VIR|TRUSTEE|TR|LLC|INC|CORP|LTD)\b', '', name, flags=re.I)
        name = re.sub(r'\s+', ' ', name).strip()
        time.sleep(0.8)
        result = ocpa_lookup(name)
        if result:
            rec.update(result)
            print(f"  [{i+1:>3}/{len(records)}] OK  {name[:35]:<35} -> {result.get('address', '')}")
        else:
            rec["needs_review"] = True
            print(f"  [{i+1:>3}/{len(records)}] --- {name[:35]:<35} -> no match")
    return records


def ocpa_lookup(owner_name: str) -> dict | None:
    if not owner_name or len(owner_name) < 3:
        return None
    try:
        resp = requests.get(
            OCPA_SEARCH,
            params={"ownerName": owner_name, "maxRecords": 5},
            headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"},
            timeout=10,
        )
        if resp.status_code != 200:
            return None
        data = resp.json()
        parcels = data if isinstance(data, list) else data.get("parcels", data.get("results", []))
        if not parcels:
            return None
        p = parcels[0]
        def get(*keys):
            for k in keys:
                v = p.get(k)
                if v:
                    return str(v).strip()
            return ""
        parcel_id = get("ParcelID", "parcelId", "strap")
        return {
            "parcel_id":    parcel_id,
            "address":      get("SiteAddress", "siteAddress", "address"),
            "city":         get("SiteCity", "siteCity", "city"),
            "zip":          get("SiteZip", "siteZip", "zip"),
            "just_value":   get("JustValue", "justValue", "assessedValue"),
            "property_use": get("UseCode", "useCode", "dor_desc"),
            "year_built":   get("YearBuilt", "yearBuilt"),
            "sqft":         get("TotalLivingArea", "totalLivingArea", "sqft"),
            "ocpa_url":     f"{OCPA_DETAIL}{parcel_id}" if parcel_id else "",
        }
    except Exception as e:
        print(f"    OCPA error: {e}")
        return None


# ── SAVE CSV ───────────────────────────────────────────────────────────────────

FIELDNAMES = [
    "doc_number", "recorded_date", "recorded_time", "doc_type",
    "grantor", "grantees",
    "address", "city", "zip", "parcel_id",
    "just_value", "sqft", "year_built", "property_use",
    "legal", "county", "state",
    "ocpa_url", "needs_review",
]

def save_csv(records: list[dict]) -> str:
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(records)
    print(f"\n  Saved -> {OUTPUT_CSV}")
    return OUTPUT_CSV


# ── MAIN ───────────────────────────────────────────────────────────────────────

async def main():
    records = await scrape_lis_pendens()
    if not records:
        print("\n  No records found.")
        return
    records = enrich_with_ocpa(records)
    save_csv(records)
    needs = sum(1 for r in records if r.get("needs_review"))
    print(f"\n  Done! {len(records)} records saved to {OUTPUT_CSV}")
    if needs:
        print(f"  {needs} flagged needs_review")
    print("="*60 + "\n")

if __name__ == "__main__":
    asyncio.run(main())