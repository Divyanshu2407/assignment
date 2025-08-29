# Tiptap Pagination

A minimal React + Tiptap prototype for a paginated legal document editor.

## Features
- Visual A4 page boundaries (manual and auto breaks).
- Manual page breaks (button/Cmd+Enter).
- Dynamic headers/footers with page numbers.
- Print/export support.

## Setup
1. `npm install`
2. `npm start`

## Constraints & Trade-offs
- Constraints: Tiptap free lacks native auto-pagination, so custom logic used for height check; dynamic page numbers require manual counting; no thumbnails as in Figma (bonus not fully implemented due to time).
- Trade-offs: Plain CSS used instead of Tailwind (failed due to PostCSS issues) for reliability; static design matches Figma direction but not pixel-perfect; auto-break uses height proxy (trade-off for accuracy vs performance).
- Vulnerabilities: 9 issues ignored for deadline; trade-off for functionality over security in prototype.

## Productionising
- Upgrade to Tiptap Pro for native Pages extension (automatic breaks, dynamic headers).
- Add backend (e.g., Firebase) for saving JSON content.
- Optimize performance (web workers for height calc).
- Add Figma bonus features (thumbnails, PDF export with jsPDF).
- Test cross-browser print (Chrome, Firefox).
- Add accessibility (ARIA labels for pages/breaks).