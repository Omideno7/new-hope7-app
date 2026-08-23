# New Hope 7 Public Library — Trilingual Rich Books v2.6.0

Status: **IN REVIEW — NOT PUBLISHED**

All titles in this batch are intended for the Public Library. Each finished title must contain a structured in-app edition in **FA / EN / HR** with chapter titles, headings, subheadings, paragraphs, scripture/quotation blocks and lists preserved as semantic blocks.

| # | Canonical title | Source material | Source language | PDF pages | Target | Status |
|---|---|---|---|---:|---|---|
| 1 | How to Receive a Miracle and Retain It | `how-to-receive-a-miracle-and-retain-it.pdf` | EN | 64 | FA/EN/HR | source_structuring |
| 2 | Seven Things the Holy Spirit Will Do in You | Persian official edition uploaded | FA | 50 | FA/EN/HR | source_structuring |
| 3 | Don't Stop Here! — A Spiritual Journey to Greater Impact | English PDF uploaded | EN | 77 | FA/EN/HR | queued |
| 4 | When God Visits You | English + Persian editions uploaded | EN primary, FA reference | 85 EN / 68 FA | FA/EN/HR | source_structuring |
| 5 | Praying the Right Way | English PDF uploaded | EN | 73 | FA/EN/HR | queued |
| 6 | How to Pray Effectively — Volume One | English PDF uploaded | EN | 84 | FA/EN/HR | queued |
| 7 | The Counter Attack — Revised Edition | English PDF uploaded | EN | 50 | FA/EN/HR | queued |
| 8 | Join This Chariot | English PDF uploaded | EN | 122 | FA/EN/HR | queued |
| 9 | The Holy Spirit & You | English PDF uploaded | EN | 81 | FA/EN/HR | queued |

## Reader implementation

- `nh7_library_reader_access_v260` — requested app language with deterministic fallback, additive to the existing authorization layer.
- `js/nh7-library-rich-reader-v260.js` — structured chapter/block reader.
- `css/nh7-library-rich-reader-v260.css` — professional book typography.
- Legacy page/text payloads continue to render; new rich payloads use `chapters[].blocks[]`.

## Structured block schema

Supported block types: `chapter_title`, `heading`, `subheading`, `paragraph`, `scripture`, `quote`, `list`, `numbered_list`, `callout`, `divider`.

## QA gates per title

1. Every content chapter represented and ordered correctly.
2. No repeated running headers, footers, page numbers or extraction artifacts.
3. Source-language edition proofread against the supplied PDF.
4. Persian translation fluent and clear, preserving theological terminology and Scripture references.
5. Croatian translation natural and clear, preserving theological terminology and Scripture references.
6. FA/EN/HR structural parity at chapter/section level.
7. Title remains unpublished until final QA.
