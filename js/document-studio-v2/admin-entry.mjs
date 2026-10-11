import { t } from "./ui.mjs";
function captureLayout() {
  const page = document.querySelector("#nh7-document-preview");
  if (!page) return null;
  const box = page.getBoundingClientRect();
  if (!box.width || !box.height) return null;
  const width = page.classList.contains("layout-landscape") ? 297 : 210,
    height = width === 297 ? 210 : 297;
  const selectors = {
    title: ".doc-main h1",
    subtitle: ".doc-main h2",
    recipient: ".doc-recipient",
    body: ".doc-body",
    church: ".doc-church",
    photo: ".nh7-doc-photo-frame-v520",
    logo: ".doc-logo",
    qr: ".nh7-doc-qr",
    signer: ".doc-sign span",
    role: ".doc-sign small",
    contact: ".doc-footer-church-v520",
    watermark: ".nh7-v239-watermark",
  };
  const output = {};
  for (const [type, selector] of Object.entries(selectors)) {
    const n = page.querySelector(selector);
    if (!n || getComputedStyle(n).display === "none") continue;
    const r = n.getBoundingClientRect(),
      s = getComputedStyle(n);
    output[type] = {
      x: ((r.left - box.left) / box.width) * width,
      y: ((r.top - box.top) / box.height) * height,
      width: (r.width / box.width) * width,
      height: (r.height / box.height) * height,
      fontSize: parseFloat(s.fontSize) * 0.75,
      fontWeight: Number(s.fontWeight) || 400,
      align: s.textAlign,
    };
  }
  return output;
}

function open() {
  const nonce = crypto.randomUUID(),
    child = window.open(
      new URL("document-studio.html#" + nonce, location.href),
      "_blank",
    );
  if (!child) return;
  const document = window.NH7CurrentDocumentV508?.draft?.();
  const listener = (event) => {
    if (
      event.origin !== location.origin ||
      event.source !== child ||
      event.data?.type !== "nh7-studio-v2-ready" ||
      event.data?.nonce !== nonce
    )
      return;
    if (document)
      child.postMessage(
        {
          type: "nh7-studio-v2-import",
          nonce,
          document,
          layout: captureLayout(),
        },
        location.origin,
      );
    removeEventListener("message", listener);
  };
  addEventListener("message", listener);
  setTimeout(() => removeEventListener("message", listener), 60000);
}
let frame = 0;
function mount() {
  frame = 0;
  const workspace = document.querySelector(".nh7-doc-workspace-actions-v522");
  if (!workspace) return;
  let button = workspace.querySelector("[data-studio-v2-entry]");
  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.className = "nh7-doc-primary-v522";
    button.dataset.studioV2Entry = "1";
    button.onclick = open;
    workspace.prepend(button);
  }
  const language =
      localStorage.getItem("nh7_admin_lang") ||
      localStorage.getItem("nh7_lang") ||
      "en",
    text = t("studio", language);
  if (button.textContent !== text) button.textContent = text;
}
new MutationObserver(() => {
  if (!frame) frame = requestAnimationFrame(mount);
}).observe(document.body, { childList: true, subtree: true });
mount();
