/* New Hope 7 — 19-book trilingual Apocrypha preview layer.
 * Preview-only: all newly translated rows remain in_review.
 */
(function () {
  "use strict";

  const ASSET_URL = "data/apocrypha/runtime/apocrypha-browser-19.preview.json?v=6401";
  const labels = {
    fa: {
      section: "کتاب‌های اپوکریفا",
      desc: "۱۹ کتاب با پوشش فارسی، انگلیسی و کرواتی",
      loading: "در حال آماده‌سازی ۱۹ کتاب اپوکریفا…",
      failed: "داده‌های اپوکریفا بارگذاری نشد. دوباره تلاش کنید.",
      retry: "تلاش دوباره",
      page: "صفحه",
      prepared: "متن فارسی آمادهٔ پیشین — نمایش صفحه‌ای",
      review: "پیش‌نمایش بازبینی — ترجمه‌های تازه هنوز in_review هستند",
      source: "منبع کرواتی آماده: CC BY 4.0",
    },
    en: {
      section: "Apocrypha",
      desc: "19 books with Persian, English, and Croatian coverage",
      loading: "Preparing the 19 Apocrypha books…",
      failed: "The Apocrypha data could not be loaded. Please try again.",
      retry: "Try again",
      page: "Page",
      prepared: "Prepared Persian text — page view",
      review: "Review preview — newly translated text remains in_review",
      source: "Prepared Croatian source: CC BY 4.0",
    },
    hr: {
      section: "Apokrifi",
      desc: "19 knjiga s perzijskim, engleskim i hrvatskim tekstom",
      loading: "Priprema 19 apokrifnih knjiga…",
      failed: "Podaci apokrifnih knjiga nisu učitani. Pokušajte ponovno.",
      retry: "Pokušaj ponovno",
      page: "Stranica",
      prepared: "Pripremljeni perzijski tekst — prikaz stranica",
      review: "Pregled za provjeru — novi prijevodi ostaju in_review",
      source: "Pripremljeni hrvatski izvor: CC BY 4.0",
    },
  };

  const appIdFor = (bookId) => `APO_${bookId.toUpperCase()}`;
  const esc = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  const ui = () => labels[currentLang] || labels.en;
  const localizedNumber = (value) =>
    currentLang === "fa" && typeof toFaDigits === "function" ? toFaDigits(value) : value;

  let asset = null;
  let assetPromise = null;
  let installError = null;
  const runtimeByAppId = new Map();

  const nativeRenderBibleReader = window.renderBibleReader;
  const nativeSetBibleSection = window.setBibleSection;
  const nativeOpenBibleBook = window.openBibleBook;

  function preparedHrChapters(book) {
    const prepared = book.hr_prepared || book.croatian_prepared || null;
    return Array.isArray(prepared?.chapters) ? prepared.chapters : [];
  }

  function installAsset(payload) {
    if (!payload || payload.asset_id !== "new_hope_7_apocrypha_browser_19_preview") {
      throw new Error("Unexpected Apocrypha preview asset");
    }
    if (payload.totals?.books !== 19 || payload.totals?.english_books !== 19) {
      throw new Error("Incomplete Apocrypha preview asset");
    }
    const data = window.bibleReaderData;
    if (!data) throw new Error("Bible reader data is unavailable");

    data.sections = (data.sections || []).filter((section) => section.id !== "apocrypha");
    data.sections.push({
      id: "apocrypha",
      fa: labels.fa.section,
      en: labels.en.section,
      hr: labels.hr.section,
      desc: { fa: labels.fa.desc, en: labels.en.desc, hr: labels.hr.desc },
    });
    data.books = (data.books || []).filter((book) => book.section !== "apocrypha");
    data.apocryphaBooks = [];
    data.chapters = data.chapters || {};
    runtimeByAppId.clear();

    for (const book of payload.books || []) {
      const appId = appIdFor(book.book_id);
      const appBook = {
        id: appId,
        runtime_book_id: book.book_id,
        section: "apocrypha",
        chapters: book.coverage?.en?.chapters || book.chapters?.length || 1,
        fa: book.title_fa,
        en: book.title_en,
        hr: book.title_hr,
      };
      data.books.push(appBook);
      runtimeByAppId.set(appId, book);

      const chapters = {};
      for (const chapter of book.chapters || []) {
        chapters[String(chapter.chapter)] = {
          en: (chapter.verses || []).map((verse) => ({ v: verse.verse, t: verse.text_en })),
          fa: (chapter.verses || [])
            .filter((verse) => typeof verse.text_fa === "string" && verse.text_fa.trim())
            .map((verse) => ({ v: verse.verse, t: verse.text_fa })),
          hr: (chapter.verses || [])
            .filter((verse) => typeof verse.text_hr === "string" && verse.text_hr.trim())
            .map((verse) => ({ v: verse.verse, t: verse.text_hr })),
        };
      }
      const hrPrepared = preparedHrChapters(book);
      if (hrPrepared.length) {
        for (const chapter of hrPrepared) {
          const key = String(chapter.chapter);
          chapters[key] = chapters[key] || { en: [], fa: [], hr: [] };
          chapters[key].hr = (chapter.verses || []).map((verse) => ({
            v: verse.verse,
            t: verse.text_hr,
          }));
        }
      }
      data.chapters[appId] = chapters;
    }
    asset = payload;
    installError = null;
    window.OM7_APOCRYPHA_19_PREVIEW = {
      asset,
      runtimeByAppId,
      status: "ready",
    };
  }

  function loadAsset(force) {
    if (asset && !force) return Promise.resolve(asset);
    if (assetPromise && !force) return assetPromise;
    installError = null;
    assetPromise = fetch(ASSET_URL, { cache: force ? "reload" : "force-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`Apocrypha asset HTTP ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        installAsset(payload);
        return payload;
      })
      .catch((error) => {
        installError = error;
        console.error("Apocrypha preview asset failed", error);
        throw error;
      })
      .finally(() => {
        assetPromise = null;
      });
    return assetPromise;
  }

  function renderLoading() {
    const root = document.getElementById("bibleReaderContent");
    if (!root) return;
    root.innerHTML = `<div class="card apocrypha-preview-state"><p>${esc(ui().loading)}</p></div>`;
  }

  function renderFailure() {
    const root = document.getElementById("bibleReaderContent");
    if (!root) return;
    root.innerHTML = `<div class="card error-card apocrypha-preview-state"><p>${esc(
      ui().failed,
    )}</p><button type="button" class="btn primary" id="apocryphaPreviewRetry">${esc(
      ui().retry,
    )}</button></div>`;
    document.getElementById("apocryphaPreviewRetry")?.addEventListener("click", () => {
      renderLoading();
      loadAsset(true)
        .then(() => setBibleSection("apocrypha"))
        .catch(renderFailure);
    });
  }

  function appendHomeCard() {
    if (bibleReaderView !== "home") return;
    const root = document.getElementById("bibleReaderContent");
    const grid = root?.querySelector(".bible-section-grid");
    if (!grid || grid.querySelector("[data-apocrypha-complete]") ) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bible-section-card apocrypha-complete-card";
    button.dataset.apocryphaComplete = "1";
    button.innerHTML = `<span class="bible-section-icon">19</span><strong>${esc(
      ui().section,
    )}</strong><small>${esc(ui().desc)}</small>`;
    button.addEventListener("click", () => setBibleSection("apocrypha"));
    grid.appendChild(button);
  }

  function needsPersianDocumentView(book) {
    if (currentLang !== "fa" || !book?.fa_document) return false;
    const translated = Number(book.coverage?.fa?.structured?.translated_rows || 0);
    const total = Number(book.coverage?.en?.rows || 0);
    return translated < total;
  }

  function renderPersianDocument(book, appBook) {
    const root = document.getElementById("bibleReaderContent");
    if (!root) return;
    const pages = book.fa_document?.pages || [];
    if (!pages.length) return;
    if (selectedBibleChapter < 1 || selectedBibleChapter > pages.length) selectedBibleChapter = 1;
    const page = pages[selectedBibleChapter - 1];
    root.innerHTML = `<div class="section-title"><h2>${esc(appBook.fa || appBook.en)}</h2></div>
      <button type="button" class="btn ghost bible-back-btn" id="apocryphaPageBack">← ${esc(
        typeof t === "function" ? t("back") : "Back",
      )}</button>
      <div class="apocrypha-review-banner"><strong>${esc(ui().prepared)}</strong><span>${esc(
        ui().review,
      )}</span></div>
      <div class="bible-reader-tools"><label>${esc(ui().page)}<select id="apocryphaPageSelect">${pages
        .map(
          (_, index) =>
            `<option value="${index + 1}" ${index + 1 === selectedBibleChapter ? "selected" : ""}>${esc(
              localizedNumber(index + 1),
            )}</option>`,
        )
        .join("")}</select></label></div>
      <div class="bible-chapter-card apocrypha-page-card"><h3>${esc(appBook.fa || appBook.en)} — ${esc(
        ui().page,
      )} ${esc(localizedNumber(selectedBibleChapter))}</h3><div class="apocrypha-page-text" dir="rtl">${esc(
        page.text,
      ).replaceAll("\n", "<br>")}</div></div>`;
    document.getElementById("apocryphaPageBack")?.addEventListener("click", () =>
      setBibleReaderView("books"),
    );
    document.getElementById("apocryphaPageSelect")?.addEventListener("change", (event) => {
      selectedBibleChapter = Number(event.target.value) || 1;
      localStorage.setItem("bibleChapter", String(selectedBibleChapter));
      renderBibleReader();
    });
  }

  function decorateReader() {
    appendHomeCard();
    if (!asset || activeBibleSection !== "apocrypha" || bibleReaderView !== "reader") return;
    const book = runtimeByAppId.get(selectedBibleBook);
    const appBook = (window.bibleReaderData?.books || []).find((entry) => entry.id === selectedBibleBook);
    if (!book || !appBook) return;
    if (needsPersianDocumentView(book)) {
      renderPersianDocument(book, appBook);
      return;
    }
    const root = document.getElementById("bibleReaderContent");
    const card = root?.querySelector(".bible-chapter-card");
    if (card && !card.querySelector(".apocrypha-review-banner")) {
      const banner = document.createElement("div");
      banner.className = "apocrypha-review-banner";
      banner.innerHTML = `<strong>${esc(ui().review)}</strong>${
        currentLang === "hr" && book.hr_prepared
          ? `<span><a href="data/apocrypha/runtime/NOTICE-HR-CC-BY-4.0.md" target="_blank" rel="noopener">${esc(
              ui().source,
            )}</a></span>`
          : ""
      }`;
      card.insertBefore(banner, card.children[1] || null);
    }
  }

  renderBibleReader = function () {
    nativeRenderBibleReader();
    decorateReader();
  };
  window.renderBibleReader = renderBibleReader;

  setBibleSection = function (sectionId) {
    if (sectionId !== "apocrypha") return nativeSetBibleSection(sectionId);
    renderLoading();
    loadAsset(false)
      .then(() => {
        activeBibleSection = "apocrypha";
        localStorage.setItem("bibleSection", activeBibleSection);
        const books = booksForActiveSection();
        if (books[0]) {
          selectedBibleBook = books[0].id;
          selectedBibleChapter = 1;
          localStorage.setItem("bibleBook", selectedBibleBook);
          localStorage.setItem("bibleChapter", "1");
        }
        bibleReaderView = "books";
        localStorage.setItem("bibleReaderView", bibleReaderView);
        activeBibleVerseRef = null;
        renderBibleReader();
      })
      .catch(renderFailure);
  };
  window.setBibleSection = setBibleSection;

  openBibleBook = function (bookId) {
    if (!runtimeByAppId.has(bookId)) return nativeOpenBibleBook(bookId);
    activeBibleSection = "apocrypha";
    return nativeOpenBibleBook(bookId);
  };
  window.openBibleBook = openBibleBook;
  window.om7ReloadApocryphaPreview = () => loadAsset(true);

  const style = document.createElement("style");
  style.textContent = `
    .apocrypha-complete-card .bible-section-icon{background:#fff1c7;color:#7a4b00}
    .apocrypha-preview-state{text-align:center;padding:28px 18px}
    .apocrypha-review-banner{display:flex;flex-direction:column;gap:4px;margin:10px 0 16px;padding:10px 12px;border:1px solid #e7c96c;border-radius:12px;background:#fff8df;color:#5b4100;font-size:.9rem}
    .apocrypha-review-banner a{color:inherit;text-decoration:underline}
    .apocrypha-page-card{direction:rtl;text-align:right}
    .apocrypha-page-text{white-space:normal;line-height:2.05;font-size:1.02rem;overflow-wrap:anywhere}
  `;
  document.head.appendChild(style);

  appendHomeCard();
  const prefetch = () => loadAsset(false).catch(() => {});
  if ("requestIdleCallback" in window) window.requestIdleCallback(prefetch, { timeout: 2500 });
  else window.setTimeout(prefetch, 1200);
})();
