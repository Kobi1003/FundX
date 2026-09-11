# Company masterdata for instant CIN verification

Files:
- `company_masterdata.xlsx` — primary source (seeded into `public.roc_companies`)
- `company_masterdata.csv` — same data for easy editing / git diffs

On `user-service` startup, `shared/migrations.py` creates `roc_companies` and
upserts rows from this Excel via `shared/company_masterdata.py`.

Demo Active CINs you can type on Register:
- U40100WB2022PTC256639 — AeroGrid Tech Innovations Private Limited
- U72900KA2024PTC182001 — NovaGrid Energy Systems Private Limited
- U72900MH2024PTC421100 — FundX Demo Ventures Private Limited

Ineligible (for negative tests):
- U35201WB2023PTC262723 — Strike Off
- U51234MH2021PTC342876 — Under Liquidation

Re-seed without restart:
`POST /api/users/admin/seed-company-masterdata`
