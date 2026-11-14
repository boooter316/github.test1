#!/usr/bin/env python3
"""Local PDF evidence indicator scanner. Extracted text is never emitted or saved."""
import argparse, re, sys
from pathlib import Path
from datetime import datetime, timezone
try:
    from pypdf import PdfReader
except ImportError:
    print("Install dependency: py -3 -m pip install --user -r requirements-pdf.txt", file=sys.stderr)
    raise SystemExit(2)
TERMS = {
 "purchase_or_order": r"\b(purchase|order|receipt|transaction|invoice|payment)\b",
 "epic_or_fortnite_reference": r"\b(epic games|epic account|fortnite|order id|transaction id)\b",
 "date_reference": r"\b(20\d{2}[-/]\d{1,2}[-/]\d{1,2}|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b",
 "account_identifier_label": r"\b(account id|account number|display name|username)\b",
 "email_address_present": r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b",
}
SECRETS = [r"\b(?:password|passwd|passcode)\s*[:=]\s*\S+", r"\b(?:access[_ -]?token|refresh[_ -]?token|api[_ -]?key|secret)\s*[:=]\s*\S+", r"\b\d{6}\b", r"\b(?:\d[ -]*?){13,19}\b"]
def inspect(path):
    out=[]
    if path.stat().st_size > 50*1024*1024: return [f"{path.name}: SKIPPED — exceeds 50 MiB"],0,0
    try:
        pdf=PdfReader(str(path),strict=False)
        if pdf.is_encrypted:
            try: unlocked=pdf.decrypt("")
            except Exception: unlocked=0
            if not unlocked: return [f"{path.name}: NOT INSPECTED — encrypted PDF"],0,0
        count=len(pdf.pages)
        if count>2000: return [f"{path.name}: SKIPPED — exceeds 2000 pages"],0,0
        readable=hits_count=0
        for n,page in enumerate(pdf.pages,1):
            try: text=page.extract_text() or ""
            except Exception: text=""
            if not text.strip():
                out.append(f"{path.name}: page {n}: NO READABLE TEXT — image-only/unsupported; OCR not performed")
                continue
            readable+=1
            hits=[name for name,pat in TERMS.items() if re.search(pat,text,re.I)]
            if any(re.search(p,text,re.I) for p in SECRETS): hits.append("possible_sensitive_value_present")
            if hits:
                hits_count+=1
                out.append(f"{path.name}: page {n}: indicators={', '.join(sorted(set(hits)))}; document text not retained")
        out.append(f"{path.name}: inspected {readable}/{count} page(s); {hits_count} page(s) with indicators")
        if not readable: out.append(f"{path.name}: NOT FULLY INSPECTED — OCR is not included")
        return out,readable,count
    except Exception as exc:
        return [f"{path.name}: ERROR — {type(exc).__name__}"],0,0
def main():
    ap=argparse.ArgumentParser(description="Local PDF evidence index; extracted text is never displayed or saved.")
    ap.add_argument("pdf",nargs="+")
    ap.add_argument("-o","--output",default="PDF_Evidence_Scan_Report.txt")
    args=ap.parse_args(); lines=["LOCAL PDF EVIDENCE SCAN — INDICATORS ONLY",f"Generated UTC: {datetime.now(timezone.utc).isoformat()}","Organizer only; not proof of account ownership or Epic verification.","No extracted text or secret values are included. OCR is not performed.",""]
    readable=pages=0
    for item in args.pdf:
        p=Path(item).expanduser()
        if not p.is_file() or p.suffix.lower()!=".pdf": lines.append(f"{p.name}: SKIPPED — not a PDF file"); continue
        notes,r,t=inspect(p); lines.extend(notes); readable+=r; pages+=t
    lines += ["",f"Readable pages: {readable}/{pages}","Ownership verification: NOT PERFORMED — only Epic can determine ownership."]
    out=Path(args.output).expanduser()
    try: out.write_text("\n".join(lines)+"\n",encoding="utf-8")
    except OSError as exc: print(f"Cannot write report ({type(exc).__name__}).",file=sys.stderr); return 1
    print(f"Local report saved: {out.resolve()}")
    print("Extracted text and secret values were not printed or saved.")
    return 0
if __name__=="__main__": raise SystemExit(main())
