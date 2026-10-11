import { render, ready, fit } from "./renderer.mjs";
import { download } from "./output.mjs";
import { normalize } from "./model.mjs";
const nonce = location.hash.slice(1),
  message = document.querySelector("#message");
let definition, page;
document.querySelector("#back").onclick = () => {
  window.close();
  message.textContent = {
    fa: "اگر پنجره بسته نشد، از بازگشت مرورگر استفاده کنید.",
    en: "Use browser Back if this window cannot close.",
    hr: "Ako se prozor ne zatvori, koristite Natrag u pregledniku.",
  }[definition?.language || "en"];
};
document.querySelector("#print").onclick = () => {
  message.textContent = {
    fa: "اگر پنجره چاپ باز نشد، در Safari از اشتراک ← چاپ یا منوی مرورگر ← چاپ استفاده کنید.",
    en: "If the print sheet does not open, use Safari Share → Print or browser menu → Print.",
    hr: "Ako se ispis ne otvori, koristite Safari Podijeli → Ispis ili izbornik preglednika → Ispis.",
  }[definition?.language || "en"];
  try {
    window.print();
  } catch (e) {
    message.textContent = e.message;
  }
};
document.querySelector("#pdf").onclick = async (e) => {
  e.target.disabled = true;
  try {
    await download(definition);
  } catch (error) {
    message.textContent = error.message;
  } finally {
    e.target.disabled = false;
  }
};
addEventListener("message", async (event) => {
  if (
    definition ||
    event.origin !== location.origin ||
    event.source !== window.opener ||
    event.data?.type !== "nh7-document-output" ||
    event.data?.nonce !== nonce
  )
    return;
  try {
    definition = normalize(event.data.document);
    document.documentElement.lang = definition.language;
    document.documentElement.dir = definition.language === "fa" ? "rtl" : "ltr";
    page = render(definition);
    document.querySelector("#sheet").replaceChildren(page);
    const style = document.createElement("style");
    style.textContent = `@page{size:A4 ${definition.orientation};margin:0}`;
    document.head.append(style);
    const overflow = await ready(page);
    fit(page, document.querySelector(".ds2-viewport"));
    message.textContent = overflow.length
      ? "Text overflow: " + overflow.join(", ")
      : "";
    document.querySelector("#print").disabled = !!overflow.length;
    document.querySelector("#pdf").disabled = !!overflow.length;
    const labels = {
      fa: ["بستن / بازگشت", "چاپ", "دانلود PDF"],
      en: ["Close / Back", "Print", "Download PDF"],
      hr: ["Zatvori / Natrag", "Ispis", "Preuzmi PDF"],
    }[definition.language];
    ["back", "print", "pdf"].forEach(
      (key, i) => (document.querySelector("#" + key).textContent = labels[i]),
    );
  } catch (error) {
    message.textContent = error.message;
  }
});
window.opener?.postMessage(
  { type: "nh7-document-output-ready", nonce },
  location.origin,
);
addEventListener("resize", () => {
  if (page) fit(page, document.querySelector(".ds2-viewport"));
});
