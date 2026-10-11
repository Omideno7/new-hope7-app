import { rpc, calls, session } from "./api.mjs";
import { render, ready, fit, publicURL } from "./renderer.mjs";
import { download, openOutput } from "./output.mjs";
import { t, esc } from "./ui.mjs";
import { types } from "./catalog.mjs";
const root = document.querySelector("#archive"),
  language = localStorage.getItem("nh7_lang") || "en";
let records = [];
const accountUID = session()?.user?.id;
document.documentElement.lang = language;
document.documentElement.dir = language === "fa" ? "rtl" : "ltr";
function clear() {
  records = [];
  root.textContent = t("login", language);
}
if (!session()?.access_token || session()?.user?.id !== accountUID) clear();
else {
  root.textContent = t("loading", language);
  try {
    const data = await rpc(calls.archive, {}, "user");
    if (session()?.user?.id !== accountUID) throw Error(t("login", language));
    records = [...(data.documents || []), ...(data.legacy || [])];
    root.innerHTML = `<header class="ds2-public-header"><a href="index.html#account">${esc(t("close", language))}</a><h1>${esc(t("archive", language))}</h1></header><label>${esc(t("type", language))}<select id="category"><option value="">${esc(t("all", language))}</option>${types.map((x) => `<option value="${x.id}">${esc(x.titles[language])}</option>`).join("")}</select></label><div id="list"></div><p id="message" role="status"></p><dialog id="viewer"></dialog>`;
    const refresh = () => {
      const category = root.querySelector("#category").value;
      root.querySelector("#list").innerHTML =
        records
          .filter((r) => !category || (r.document?.type || r.type) === category)
          .map(
            (r, i) =>
              `<article class="ds2-record"><h2>${esc(types.find((x) => x.id === (r.document?.type || r.type))?.titles[language] || t("document", language))}</h2><p>${esc(r.number)} · ${esc(r.document?.issueDate || r.issue_date || String(r.issued_at || "").slice(0, 10))} · ${esc(t(r.status, language))}</p><div class="ds2-row">${["view", "verify", "pdf", "share"].map((key) => `<button data-action="${key}" data-id="${records.indexOf(r)}">${esc(t(key, language))}</button>`).join("")}</div></article>`,
          )
          .join("") || esc(t("empty", language));
    };
    root.querySelector("#category").onchange = refresh;
    refresh();
    root.onclick = async (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;
      if (session()?.user?.id !== accountUID) {
        clear();
        return;
      }
      const record = records[Number(button.dataset.id)];
      if (!record) return;
      const url = record.legacy
        ? new URL(
            "certificate.html?token=" + encodeURIComponent(record.public_token),
            location.href,
          ).href
        : publicURL(record.public_token);
      try {
        if (record.legacy || button.dataset.action === "verify") {
          window.open(url, "_blank");
          return;
        }
        if (button.dataset.action === "share") {
          if (navigator.share)
            await navigator.share({ title: record.number, url });
          else {
            await navigator.clipboard.writeText(url);
            root.querySelector("#message").textContent =
              t("copy", language) + " ✓";
          }
          return;
        }
        if (button.dataset.action === "pdf") {
          button.disabled = true;
          await download(record.document);
          return;
        }
        const dialog = root.querySelector("#viewer");
        dialog.innerHTML = `<button id="close">${esc(t("close", language))}</button><button id="print">${esc(t("print", language))}</button><div class="ds2-viewport"><div class="ds2-scaled" id="page"></div></div>`;
        const page = render(record.document);
        dialog.querySelector("#page").append(page);
        dialog.showModal();
        await ready(page);
        fit(page, dialog.querySelector(".ds2-viewport"));
        dialog.querySelector("#close").onclick = () => dialog.close();
        dialog.querySelector("#print").onclick = () =>
          openOutput(record.document);
      } catch (error) {
        root.querySelector("#message").textContent = error.message;
      } finally {
        button.disabled = false;
      }
    };
  } catch (error) {
    root.textContent = t("error", language) + ": " + error.message;
  }
}
addEventListener("storage", (event) => {
  if (
    event.key === "nh7_user_session_v170" &&
    session()?.user?.id !== accountUID
  )
    clear();
});
addEventListener("nh7-session-refreshed", () => {
  if (!session()?.access_token || session()?.user?.id !== accountUID) clear();
});
