# Odoo Invoicing & Accounting (Node.js)

Web-based Invoicing & Accounting application migrated from the Odoo Python accounting addons (`account`, `account_debit_note`, `account_check_printing`, `account_edi_ubl_cii`) to Node.js 22, Express, React, and TypeScript.

## Features

- **Accounting Dashboard**: Journal Kanban overview with real-time KPIs (Receivables, Payables, Bank & Cash Balance, Net Profit YTD) and mini journal charts.
- **Customer Invoices & Credit Notes**: Full draft-to-posted lifecycle, inline invoice line editor, automatic tax computation (15% / 0% Exports), balanced double-entry journal items, Credit Note reversals, and Debit Notes.
- **Vendor Bills & Check Printing**: Vendor bill workflow, payment registration, and printable check previews with sequential check numbering.
- **Electronic Invoicing (UBL 2.1 XML)**: Download EN 16931 / UBL 2.1 XML invoices directly from any invoice or the Customer Portal.
- **Chart of Accounts, Taxes & Journals**: Seeded from Odoo's Generic Chart of Accounts with live Debit/Credit/Balance aggregation.
- **Invoice Analysis & Customer Portal**: Monthly/partner reporting and self-service `/my/invoices` portal view.

## Scripts

- `npm run dev` — Starts the Express + Vite server on `0.0.0.0:3000`.
- `npm run build` — Builds the production frontend bundle into `dist/`.
- `npm start` — Runs the server with Node.js on port `3000`.
- `npm run lint` — Type-checks client and server TypeScript with `tsc --noEmit`.
