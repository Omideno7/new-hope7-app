import { rpc, calls } from "./api.mjs";
import { render, ready, fit } from "./renderer.mjs";
import { download, openOutput } from "./output.mjs";
import { t, esc } from "./ui.mjs";
import { types } from "./catalog.mjs";
const root = document.querySelector("#verification"),
  token = new URL(location.href).searchParams.get("token");
let language = ["fa", "en", "hr"].includes(localStorage.getItem("nh7_lang"))
    ? localStorage.getItem("nh7_lang")
    : "en",
  definition;
root.textContent = t("loading", language);
try {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      token || "",
    )
  )
    throw Object.assign(Error(t("not_found", language)), { notFound: true });
  const response = await rpc(calls.verify, { p_token: token }, "public");
  if (response.status === "valid" && response.document) {
    definition = response.document;
    language = definition.language;
  }
  document.documentElement.lang = language;
  document.documentElement.dir = language === "fa" ? "rtl" : "ltr";
  const status = ["valid", "revoked", "expired", "not_found"].includes(
    response.status,
  )
    ? response.status
    : "not_found";
  root.innerHTML = `<header class="ds2-public-header"><img src="assets/logo.png" width="56" height="56" alt="New Hope 7"><h1>New Hope 7 · Omideno7</h1><span class="ds2-badge ${status === "valid" ? "" : "revoked"}">${esc(t(status, language))}</span><p>${esc(response.number || "")}</p>${definition ? `<h2>${esc(definition.contents[language].title || types.find((x) => x.id === definition.type)?.titles[language] || "")}</h2><p>${esc(definition.recipient.name)}</p><p>${esc(definition.issueDate)}</p><p>${esc(definition.church.name)} · ${esc(definition.verification.code)}</p><p>${esc(t("confirmed", language))}</p>` : ""}<a href="https://omideno7church.com/">${esc(t("website", language))}</a></header><p id="message" role="status"></p>${definition ? `<div class="ds2-output-actions"><button id="pdf">${esc(t("pdf", language))}</button><button id="print">${esc(t("print", language))}</button></div><div class="ds2-viewport"><div class="ds2-scaled" id="page"></div></div>` : ""}`;
  if (definition) {
    const page = render(definition);
    root.querySelector("#page").append(page);
    await ready(page);
    fit(page, root.querySelector(".ds2-viewport"));
    addEventListener("resize", () =>
      fit(page, root.querySelector(".ds2-viewport")),
    );
    root.querySelector("#pdf").onclick = async (e) => {
      e.target.disabled = true;
      try {
        await download(definition);
      } catch (error) {
        root.querySelector("#message").textContent = error.message;
      } finally {
        e.target.disabled = false;
      }
    };
    root.querySelector("#print").onclick = () => {
      try {
        openOutput(definition);
      } catch (error) {
        root.querySelector("#message").textContent = error.message;
      }
    };
  }
} catch (error) {
  root.textContent = t(error.notFound ? "not_found" : "verifyError", language);
}
