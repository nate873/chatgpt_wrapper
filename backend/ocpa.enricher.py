"""
ocpa_enricher.py
----------------
Enriches a lis pendens CSV with address/parcel data from OCPA.

Automatically skips any row that already has an address — so you can
stop and restart at any time without redoing work.

Usage:
    python ocpa_enricher.py                         # uses default INPUT_CSV
    python ocpa_enricher.py oc_merged_input.csv     # or pass a file
"""

import asyncio
import csv
import os
import re
from datetime import datetime
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

INPUT_CSV  = "oc_lis_pendens_20260508_223830.csv"
OUTPUT_CSV = f"oc_enriched_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

OCPA_URL = "https://ocpaweb.ocpafl.org/parcelsearch"

FIELDNAMES = [
    "doc_number", "recorded_date", "recorded_time", "doc_type",
    "grantor", "grantees",
    "address", "city", "zip", "parcel_id",
    "just_value", "sqft", "year_built", "property_use",
    "legal", "county", "state",
    "ocpa_url", "needs_review",
]

PARCEL_RE = re.compile(r'\d{2}-\d{2}-\d{2}-\d{4}-\d{2}-\d{3}')


def clean_name(raw: str) -> str:
    name = raw.split("|")[0].strip()
    name = re.sub(r'\b(ET AL|ET UX|ET VIR|TRUSTEE|TR|LLC|INC|CORP|LTD)\b', '', name, flags=re.I)
    return re.sub(r'\s+', ' ', name).strip()


def load_csv(path: str) -> list[dict]:
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def save_csv(records: list[dict], path: str):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(records)
    print(f"  Saved -> {path}")


async def lookup_owner(page, owner_name: str) -> dict | None:
    try:
        # 1. Go to search page fresh
        await page.goto(OCPA_URL, wait_until="domcontentloaded", timeout=30_000)
        await page.wait_for_timeout(2_000)

        # 2. Fill Owner Name and press Enter
        owner_input = page.locator("input[placeholder='Enter Owner Name']")
        await owner_input.wait_for(state="visible", timeout=10_000)
        await owner_input.click()
        await owner_input.fill(owner_name)
        await page.wait_for_timeout(500)
        await owner_input.press("Enter")
        await page.wait_for_timeout(2_500)

        # 3. Click RESULTS tab
        try:
            await page.locator("text=RESULTS").first.click()
            await page.wait_for_timeout(1_500)
        except Exception:
            pass

        # 4. Read the results table
        html = await page.content()
        soup = BeautifulSoup(html, "html.parser")

        table = None
        for t in soup.find_all("table"):
            header = t.get_text(" ", strip=True).upper()
            if "OWNER" in header and "ADDRESS" in header and "PARCEL" in header:
                table = t
                break

        if not table:
            print(f"      no results table found")
            return None

        headers = []
        header_row = table.find("tr")
        if header_row:
            headers = [th.get_text(strip=True).upper() for th in header_row.find_all(["th", "td"])]

        owner_col   = next((i for i, h in enumerate(headers) if "OWNER"   in h), 0)
        address_col = next((i for i, h in enumerate(headers) if "ADDRESS" in h), 1)
        parcel_col  = next((i for i, h in enumerate(headers) if "PARCEL"  in h), 3)

        name_words = [w for w in owner_name.upper().split() if len(w) > 2]

        best_row   = None
        best_score = 0

        for row in table.find_all("tr")[1:]:
            cells = row.find_all(["td", "th"])
            if len(cells) < 2:
                continue

            owner_cell   = cells[owner_col].get_text(strip=True).upper()  if len(cells) > owner_col   else ""
            address_cell = cells[address_col].get_text(strip=True)         if len(cells) > address_col else ""
            parcel_cell  = cells[parcel_col].get_text(strip=True)          if len(cells) > parcel_col  else ""

            score = sum(1 for w in name_words if w in owner_cell)
            if score > best_score:
                best_score = score
                best_row = {
                    "address":   address_cell,
                    "parcel_id": PARCEL_RE.search(parcel_cell).group(0) if PARCEL_RE.search(parcel_cell) else "",
                    "owner":     owner_cell,
                }

        if not best_row or best_score < 2:
            print(f"      no name match in results (best score={best_score})")
            return None

        address = best_row["address"]
        parcel  = best_row["parcel_id"]
        print(f"      matched '{best_row['owner']}' -> address={address}  parcel={parcel}")

        city     = ""
        zip_     = ""
        ocpa_url = f"https://ocpaweb.ocpafl.org/parcelsearch/Parcels/{parcel}" if parcel else page.url

        if parcel:
            await page.goto(ocpa_url, wait_until="domcontentloaded", timeout=30_000)
            await page.wait_for_timeout(1_500)
            card_html = await page.content()
            card_soup = BeautifulSoup(card_html, "html.parser")

            for cell in card_soup.find_all(["td", "div", "span"]):
                if "Postal City and Zip" in cell.get_text():
                    nxt = cell.find_next_sibling()
                    val = nxt.get_text(strip=True) if nxt else ""
                    if not val:
                        val = re.sub(r'Postal City and Zip\s*:?\s*', '', cell.get_text(strip=True)).strip()
                    m = re.match(r'(.+),\s*FL\s+(\d{5})', val)
                    if m:
                        city = m.group(1).strip()
                        zip_ = m.group(2).strip()
                    break

        return {
            "address":      address,
            "city":         city,
            "zip":          zip_,
            "parcel_id":    parcel,
            "ocpa_url":     ocpa_url,
            "needs_review": False,
        }

    except Exception as e:
        print(f"    ERROR for '{owner_name}': {e}")
        return None


async def enrich_csv(input_path: str):
    records = load_csv(input_path)

    # ── Deduplicate by doc_number before doing anything ────────────────────
    seen_docs   = set()
    deduped     = []
    dup_count   = 0
    for rec in records:
        doc = rec.get("doc_number", "").strip()
        if doc in seen_docs:
            dup_count += 1
            continue
        seen_docs.add(doc)
        deduped.append(rec)

    if dup_count:
        print(f"  Removed {dup_count} duplicate doc_number(s) from input.")
    records = deduped
    # ───────────────────────────────────────────────────────────────────────

    already_done = sum(
        1 for r in records
        if r.get("address", "").strip()
    )

    print(f"\n{'='*60}")
    print(f"  OCPA Enrichment")
    print(f"  Total records : {len(records)}")
    print(f"  Already done  : {already_done}  (will skip)")
    print(f"  To process    : {len(records) - already_done}")
    print(f"{'='*60}\n")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            slow_mo=50,
            args=["--no-sandbox", "--start-maximized"]
        )
        page = await browser.new_page()
        await page.set_viewport_size({"width": 1280, "height": 900})

        matched   = 0
        unmatched = 0

        for i, rec in enumerate(records):
            # Skip if already enriched
            if rec.get("address", "").strip():
                print(f"  [{i+1:>4}/{len(records)}] SKIP  (already done) {rec['address']}")
                matched += 1
                continue

            raw_name   = rec.get("grantees", "") or rec.get("grantor", "")
            owner_name = clean_name(raw_name)

            if not owner_name or len(owner_name) < 3:
                rec["needs_review"] = True
                unmatched += 1
                print(f"  [{i+1:>4}/{len(records)}] SKIP  (no usable name)")
                continue

            print(f"\n  [{i+1:>4}/{len(records)}] searching: {owner_name}")
            result = await lookup_owner(page, owner_name)
            await asyncio.sleep(1.0)

            if result:
                rec.update(result)
                matched += 1
                print(f"  [{i+1:>4}/{len(records)}] OK    -> {result.get('address')}  {result.get('city')}  {result.get('zip')}")
            else:
                rec["needs_review"] = True
                unmatched += 1
                print(f"  [{i+1:>4}/{len(records)}] MISS")

            # Save progress every 25 new lookups
            if (i + 1) % 25 == 0:
                save_csv(records, OUTPUT_CSV)
                print(f"  >> Progress saved ({i+1}/{len(records)})\n")

        await browser.close()

    save_csv(records, OUTPUT_CSV)
    print(f"\n  Done!")
    print(f"  Matched   : {matched}")
    print(f"  No match  : {unmatched}")
    print(f"  Output    : {OUTPUT_CSV}\n")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        INPUT_CSV = sys.argv[1]

    if not os.path.exists(INPUT_CSV):
        print(f"\n  ERROR: File not found: {INPUT_CSV}")
        print("  Usage:  python ocpa_enricher.py your_file.csv")
    else:
        asyncio.run(enrich_csv(INPUT_CSV))