# Field Ledger — independent warehouse UI concept

This live browser prototype demonstrates a possible humanitarian warehouse workflow for discussion. It is **not commissioned, approved or connected to Danish Refugee Council**. All sample items, balances, locations, references and operators are fictional. No AI features are used in the product UI.

## View

Live demo: https://oriondrayke.github.io/field-ledger-warehouse-demo/

Portfolio: https://oriondrayke.github.io/portfolio/

Open `index.html` in a browser, or serve the directory with `python3 -m http.server 8765` and visit `http://localhost:8765/`.

## Demonstrated flows

- Overview of stock, attention signals and recent movements
- Inventory search, location filter and CSV export
- Receipt, dispatch and internal transfer forms with quantity checks
- Physical stock count and difference record
- Reports by location, attention list and movement mix
- Audit history and sample-data reset

Changes are saved only in the browser's local storage. There is no server, multi-user access, authentication, API, real-time synchronization, approval workflow or production data security. Those would be scoped from the actual DRC solicitation if an individual consultant may bid.

## Source and provenance

The interface, route illustration and Field Ledger mark are original HTML, CSS, JavaScript and SVG created for this concept. No DRC logo, private data or real organisation records are included. The display font is self-hosted Archivo Black under the included SIL Open Font License (`assets/OFL-ArchivoBlack.txt`); the site does not request fonts from an external server. The UI was designed after reviewing the variety in Edward Mathew's Korvia and Vino & Views concept galleries, without copying their layouts.
