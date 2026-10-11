import { t } from "./ui.mjs";
import { session } from "./api.mjs";
let frame = 0;
function mount() {
  frame = 0;
  const anchor = document.querySelector("#logoutAccountBtn");
  if (!anchor || !session()?.user?.id) {
    document.querySelector("[data-documents-v2-entry]")?.remove();
    return;
  }
  let link = document.querySelector("[data-documents-v2-entry]");
  if (!link) {
    link = document.createElement("a");
    link.className = "secondary-btn";
    link.dataset.documentsV2Entry = "1";
    link.href = "my-documents.html";
    anchor.insertAdjacentElement("beforebegin", link);
  }
  const text = t("archive", localStorage.getItem("nh7_lang") || "en");
  if (link.textContent !== text) link.textContent = text;
}
new MutationObserver(() => {
  if (!frame) frame = requestAnimationFrame(mount);
}).observe(document.body, { childList: true, subtree: true });
addEventListener("storage", mount);
mount();
