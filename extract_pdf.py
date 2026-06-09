import pdfplumber
import pypdf
import os
import sys
from PIL import Image
import io

PDF_PATH = r"C:\Users\HP\Downloads\KNB Green Energy Limited.pdf"
IMAGES_DIR = r"C:\Users\HP\knb-app\public\images"

os.makedirs(IMAGES_DIR, exist_ok=True)

# ── 1. Extract ALL text with pdfplumber ──────────────────────────────────────
print("=" * 70)
print("FULL TEXT EXTRACTION")
print("=" * 70)

full_text = []
with pdfplumber.open(PDF_PATH) as pdf:
    total_pages = len(pdf.pages)
    print(f"Total pages: {total_pages}\n")
    for i, page in enumerate(pdf.pages, 1):
        text = page.extract_text() or ""
        print(f"--- PAGE {i} ---")
        print(text)
        full_text.append(text)
        print()

# ── 2. Extract images with pypdf ─────────────────────────────────────────────
print("=" * 70)
print("IMAGE EXTRACTION")
print("=" * 70)

reader = pypdf.PdfReader(PDF_PATH)

# Counters per keyword category
counters = {}

def categorize_image(page_idx, img_idx, width, height):
    """Give a descriptive name based on page position and size."""
    # We'll refine names after seeing what pages contain
    return None

image_records = []

for page_idx, page in enumerate(reader.pages, 1):
    resources = page.get("/Resources")
    if resources is None:
        continue
    xobjects = resources.get("/XObject")
    if xobjects is None:
        continue
    xobjects = xobjects.get_object() if hasattr(xobjects, 'get_object') else xobjects
    for name, obj_ref in xobjects.items():
        obj = obj_ref.get_object() if hasattr(obj_ref, 'get_object') else obj_ref
        subtype = obj.get("/Subtype")
        if subtype != "/Image":
            continue
        try:
            width = obj.get("/Width", 0)
            height = obj.get("/Height", 0)
            color_space = obj.get("/ColorSpace", "")
            filters = obj.get("/Filter", "")

            # Get raw image data
            data = obj.get_data()

            # Try to open as image
            try:
                img = Image.open(io.BytesIO(data))
                fmt = img.format or "PNG"
            except Exception:
                # Try to detect JPEG by magic bytes
                if data[:2] == b'\xff\xd8':
                    img = Image.open(io.BytesIO(data))
                    fmt = "JPEG"
                else:
                    # Reconstruct from raw
                    cs = str(color_space)
                    mode = "RGB"
                    if "Gray" in cs or "G" in cs:
                        mode = "L"
                    elif "CMYK" in cs:
                        mode = "CMYK"
                    try:
                        img = Image.frombytes(mode, (int(width), int(height)), data)
                        fmt = "PNG"
                    except Exception as e2:
                        print(f"  Page {page_idx} img {name}: could not decode ({e2})")
                        continue

            image_records.append({
                "page": page_idx,
                "name": name,
                "width": width,
                "height": height,
                "img": img,
                "fmt": fmt,
            })
        except Exception as ex:
            print(f"  Page {page_idx} img {name}: error – {ex}")

print(f"\nFound {len(image_records)} image(s) across the PDF.\n")

# Build descriptive names
# Map common product keywords in page text
page_texts = full_text  # already extracted above (0-indexed relative to page 1)

def keyword_for_page(page_idx):
    """Return a product keyword based on text on that page."""
    if page_idx - 1 < len(page_texts):
        txt = page_texts[page_idx - 1].lower()
    else:
        txt = ""
    if "briquette" in txt:
        return "briquette"
    if "pellet" in txt:
        return "pellet"
    if "charcoal" in txt:
        return "charcoal"
    if "biomass" in txt:
        return "biomass"
    if "wood chip" in txt or "woodchip" in txt:
        return "woodchip"
    if "sawdust" in txt:
        return "sawdust"
    if "husk" in txt:
        return "husk"
    return "product"

kw_counts = {}
saved_files = []

for rec in image_records:
    kw = keyword_for_page(rec["page"])
    kw_counts[kw] = kw_counts.get(kw, 0) + 1
    idx = kw_counts[kw]
    ext = "jpg" if rec["fmt"] in ("JPEG", "JPG") else "png"
    filename = f"{kw}-{idx}.{ext}"
    out_path = os.path.join(IMAGES_DIR, filename)

    img = rec["img"]
    if img.mode == "CMYK":
        img = img.convert("RGB")
    elif img.mode not in ("RGB", "L", "RGBA"):
        try:
            img = img.convert("RGB")
        except Exception:
            pass

    try:
        save_fmt = "JPEG" if ext == "jpg" else "PNG"
        img.save(out_path, format=save_fmt)
        print(f"  Saved: {filename}  (page {rec['page']}, {rec['width']}x{rec['height']})")
        saved_files.append(out_path)
    except Exception as e:
        print(f"  Failed to save {filename}: {e}")

print(f"\nTotal images saved: {len(saved_files)}")
print("Saved to:", IMAGES_DIR)

# ── 3. Product catalog summary ───────────────────────────────────────────────
print("\n" + "=" * 70)
print("PRODUCT CATALOG SUMMARY (raw text for analysis)")
print("=" * 70)
print("\n".join(full_text))
