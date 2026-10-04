# SCC Vaping Observatory

This repository is the canonical public publication layer for SCC Vaping, an SCC Nexus evidence project.

## Historical lineage and controlled transition

The project was migrated from the historical `homegundredaroad/Vaping26` repository into the dedicated `sccvaping` estate. The legacy repository is retained as historical provenance.

The target production path is:

`sccvaping/research` validated exact-run artifact → publication-firewall revalidation → `sccvaping/observatory` → independent public-repository validation → GitHub Pages.

Until a least-privilege `PUBLIC_REPO_TOKEN` for `sccvaping/observatory` is provisioned in the private research repository, the existing verified historical transport relay remains an automatic compatibility fallback so scheduled publication does not regress. The canonical Observatory verifies the SHA-256/size manifest before accepting relay data.

When direct publication first succeeds, the publisher writes a root `publication-mode.json` marker. The Observatory maintenance workflow then stops importing the historical relay and operates in direct-canonical verification mode.

Only material approved for public release may be published here. Private research, raw source records, credentials, investigation material and working data belong outside this public repository, principally in `sccvaping/research`.
