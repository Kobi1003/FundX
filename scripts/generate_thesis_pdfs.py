#!/usr/bin/env python3
"""Generate minimal text PDFs for deal theses (no external deps beyond stdlib)."""

from __future__ import annotations

from pathlib import Path


def _escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def write_text_pdf(path: Path, title: str, paragraphs: list[str]) -> None:
    """Write a simple multi-line PDF with Helvetica text."""
    path.parent.mkdir(parents=True, exist_ok=True)
    lines: list[str] = [title, ""]
    for p in paragraphs:
        words = p.split()
        buf: list[str] = []
        for w in words:
            trial = (" ".join(buf + [w])).strip()
            if len(trial) > 95 and buf:
                lines.append(" ".join(buf))
                buf = [w]
            else:
                buf.append(w)
        if buf:
            lines.append(" ".join(buf))
        lines.append("")

    # Paginate ~48 lines/page
    pages: list[list[str]] = []
    for i in range(0, len(lines), 48):
        pages.append(lines[i : i + 48])
    if not pages:
        pages = [[title]]

    objects: list[bytes] = []
    # 1: Catalog, 2: Pages, then fonts + page objects
    # We'll assemble after knowing page count

    content_ids: list[int] = []
    page_ids: list[int] = []

    # Reserve object numbers: 1=catalog 2=pages 3=font, then pairs content/page
    font_id = 3
    next_id = 4
    for page_lines in pages:
        y = 780
        ops = ["BT /F1 11 Tf 40 800 Td 16 TL"]
        ops.append(f"({_escape(page_lines[0] if page_lines else '')}) Tj")
        for line in page_lines[1:]:
            ops.append("T*")
            ops.append(f"({_escape(line)}) Tj")
        stream = "\n".join(ops) + "\nET\n"
        stream_b = stream.encode("latin-1", errors="replace")
        content_id = next_id
        page_id = next_id + 1
        next_id += 2
        content_ids.append(content_id)
        page_ids.append(page_id)
        objects.append((content_id, b"<< /Length %d >>\nstream\n" % len(stream_b) + stream_b + b"\nendstream"))
        objects.append(
            (
                page_id,
                (
                    f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
                    f"/Contents {content_id} 0 R /Resources << /Font << /F1 {font_id} 0 R >> >> >>"
                ).encode(),
            )
        )

    kids = " ".join(f"{pid} 0 R" for pid in page_ids)
    obj_map: dict[int, bytes] = {
        1: b"<< /Type /Catalog /Pages 2 0 R >>",
        2: f"<< /Type /Pages /Kids [{kids}] /Count {len(page_ids)} >>".encode(),
        3: b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    }
    for oid, body in objects:
        obj_map[oid] = body

    out = bytearray(b"%PDF-1.4\n")
    offsets = {0: 0}
    for oid in sorted(obj_map):
        offsets[oid] = len(out)
        out.extend(f"{oid} 0 obj\n".encode())
        out.extend(obj_map[oid])
        out.extend(b"\nendobj\n")

    xref_pos = len(out)
    max_id = max(obj_map)
    out.extend(f"xref\n0 {max_id + 1}\n".encode())
    out.extend(b"0000000000 65535 f \n")
    for oid in range(1, max_id + 1):
        out.extend(f"{offsets[oid]:010d} 00000 n \n".encode())
    out.extend(b"trailer\n")
    out.extend(f"<< /Size {max_id + 1} /Root 1 0 R >>\n".encode())
    out.extend(b"startxref\n")
    out.extend(f"{xref_pos}\n".encode())
    out.extend(b"%%EOF\n")
    path.write_bytes(bytes(out))


# Rich theses with operating drivers so extractors / demo heuristics can hydrate the simulator
THESES: dict[str, dict] = {
    "AeroGrid_Investment_Thesis_Q3.pdf": {
        "title": "AeroGrid Tech — Seed Investment Thesis Q3",
        "paras": [
            "Company: AeroGrid Tech | Industry: CleanTech | Stage: Seed",
            "Raising: INR 6.2 Cr (approx USD 750,000) for grid-edge AI controllers.",
            "Current MRR: INR 420,000 | Current customers: 48 | ARPU / Pricing: INR 8,750 / month",
            "CAC: INR 22,000 | Monthly churn: 3.2% | Marketing spend: INR 180,000 / month",
            "Gross margin: 68% | Operating expenses: INR 520,000 / month | Cash / funding runway capital: INR 1.8 Cr",
            "Growth rate: 9% monthly net new ARR | Valuation multiple: 10x ARR",
            "TAM/SAM/SOM: commercial microgrids USD 14.2B / USD 2.1B / USD 180M.",
            "Moat: edge frequency stabilization IP + ESCO distribution partnerships.",
            "Competition: Stem Inc, AutoGrid — AeroGrid wins on sub-100ms local control loops.",
            "Use of funds: 45% engineering, 30% sales, 15% compliance, 10% working capital.",
        ],
    },
    "FinPulse_SeriesA_Thesis.pdf": {
        "title": "FinPulse AI — Series A Investment Thesis",
        "paras": [
            "Company: FinPulse AI | Industry: FinTech | Stage: Series A",
            "Raising: INR 12.5 Cr (approx USD 1,500,000) for ISO20022 treasury rails.",
            "Current MRR: INR 1,150,000 | Current customers: 62 | Pricing / ARPU: INR 18,500",
            "CAC: INR 45,000 | Monthly churn: 1.8% | Marketing spend: INR 350,000",
            "Gross margin: 78% | OpEx: INR 900,000 | Funding / cash: INR 4.5 Cr",
            "Growth rate: 7% monthly | Valuation multiple: 12x ARR",
            "Market: cross-border B2B settlement TAM USD 8.9B; FinPulse focuses on mid-market India↔EU corridors.",
            "Unit economics: payback < 11 months; NRR 118%.",
        ],
    },
    "BioSynthetix_Thesis_Draft_v1.pdf": {
        "title": "BioSynthetix Labs — Pre-Seed Thesis Draft",
        "paras": [
            "Company: BioSynthetix Labs | Industry: HealthTech | Stage: Pre-Seed",
            "Raising: INR 3.3 Cr (approx USD 400,000) for generative protein design.",
            "Current MRR: INR 85,000 | Customers: 6 pharma pilots | Pricing: INR 14,000",
            "CAC: INR 60,000 | Churn: 4.5% | Marketing: INR 40,000",
            "Gross margin: 55% | OpEx: INR 280,000 | Cash: INR 90 Lakh",
            "Growth rate: 12% monthly | Valuation multiple: 8x ARR",
            "Thesis: cut antibody discovery cycles from 24 months to 6 weeks via diffusion models.",
        ],
    },
    "QuantumLedger_SeriesSeed_Thesis.pdf": {
        "title": "QuantumLedger AI — Seed Thesis",
        "paras": [
            "Company: QuantumLedger AI | Industry: AI / DeepTech | Stage: Seed",
            "Raising: INR 10 Cr (approx USD 1,200,000) for post-quantum audit rails.",
            "Current MRR: INR 610,000 | Customers: 14 institutions | Pricing: INR 43,500",
            "CAC: INR 95,000 | Churn: 2.1% | Marketing: INR 220,000",
            "Gross margin: 72% | OpEx: INR 780,000 | Cash: INR 2.4 Cr",
            "Growth rate: 8% monthly | Valuation multiple: 14x ARR",
            "Moat: lattice ZK proofs for tokenized RWAs; competitors lack FIPS-aligned modules.",
        ],
    },
    "CargoFlow_Seed_Thesis.pdf": {
        "title": "CargoFlow Logistics — Seed Thesis",
        "paras": [
            "Company: CargoFlow Logistics | Industry: Logistics | Stage: Seed",
            "Raising: INR 5 Cr (approx USD 600,000) for AI lane pricing & cold-chain SLA engine.",
            "Current MRR: INR 380,000 | Customers: 95 shippers | Pricing: INR 4,000",
            "CAC: INR 12,500 | Churn: 4.0% | Marketing: INR 150,000",
            "Gross margin: 62% | OpEx: INR 410,000 | Cash: INR 1.1 Cr",
            "Growth rate: 10% monthly | Valuation multiple: 9x ARR",
        ],
    },
    "EduNova_Seed_Thesis.pdf": {
        "title": "EduNova Skills — Seed Thesis",
        "paras": [
            "Company: EduNova Skills | Industry: EdTech | Stage: Seed",
            "Raising: INR 4.2 Cr (approx USD 500,000) for B2B upskilling marketplace.",
            "Current MRR: INR 290,000 | Customers: 38 employers | Pricing: INR 7,600",
            "CAC: INR 18,000 | Churn: 3.5% | Marketing: INR 120,000",
            "Gross margin: 70% | OpEx: INR 340,000 | Cash: INR 95 Lakh",
            "Growth rate: 11% monthly | Valuation multiple: 8x ARR",
        ],
    },
    "FarmStack_Seed_Thesis.pdf": {
        "title": "FarmStack Agtech — Seed Thesis",
        "paras": [
            "Company: FarmStack | Industry: AgriTech | Stage: Seed",
            "Raising: INR 3.8 Cr (approx USD 450,000) for FPO marketplace + IoT spoilage tags.",
            "Current MRR: INR 210,000 | Customers: 120 FPOs | Pricing: INR 1,750",
            "CAC: INR 8,000 | Churn: 5.0% | Marketing: INR 90,000",
            "Gross margin: 58% | OpEx: INR 260,000 | Cash: INR 80 Lakh",
            "Growth rate: 13% monthly | Valuation multiple: 7x ARR",
        ],
    },
    "SecureNest_SeriesA_Thesis.pdf": {
        "title": "SecureNest — Series A Thesis",
        "paras": [
            "Company: SecureNest | Industry: Cybersecurity | Stage: Series A",
            "Raising: INR 15 Cr (approx USD 1,800,000) for cloud workload identity mesh.",
            "Current MRR: INR 2,400,000 | Customers: 55 enterprises | Pricing: INR 43,600",
            "CAC: INR 120,000 | Churn: 1.2% | Marketing: INR 500,000",
            "Gross margin: 82% | OpEx: INR 1,600,000 | Cash: INR 6 Cr",
            "Growth rate: 6% monthly | Valuation multiple: 15x ARR",
        ],
    },
    "MediRoute_PreSeed_Thesis.pdf": {
        "title": "MediRoute — Pre-Seed Thesis",
        "paras": [
            "Company: MediRoute | Industry: HealthTech | Stage: Pre-Seed",
            "Raising: INR 2.5 Cr (approx USD 300,000) for last-mile pharma cold-chain routing.",
            "Current MRR: INR 95,000 | Customers: 22 distributors | Pricing: INR 4,300",
            "CAC: INR 15,000 | Churn: 4.8% | Marketing: INR 35,000",
            "Gross margin: 60% | OpEx: INR 180,000 | Cash: INR 55 Lakh",
            "Growth rate: 14% monthly | Valuation multiple: 7x ARR",
        ],
    },
    "PayLattice_Seed_Thesis.pdf": {
        "title": "PayLattice — Seed Thesis",
        "paras": [
            "Company: PayLattice | Industry: FinTech | Stage: Seed",
            "Raising: INR 7 Cr (approx USD 850,000) for embedded payout orchestration API.",
            "Current MRR: INR 540,000 | Customers: 71 platforms | Pricing: INR 7,600",
            "CAC: INR 28,000 | Churn: 2.4% | Marketing: INR 200,000",
            "Gross margin: 75% | OpEx: INR 620,000 | Cash: INR 2 Cr",
            "Growth rate: 9% monthly | Valuation multiple: 11x ARR",
        ],
    },
}


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    out_dir = root / "frontend" / "public" / "theses"
    for name, meta in THESES.items():
        write_text_pdf(out_dir / name, meta["title"], meta["paras"])
        print(f"wrote {out_dir / name}")


if __name__ == "__main__":
    main()
