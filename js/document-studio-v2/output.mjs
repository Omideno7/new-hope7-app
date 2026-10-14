import { render, ready } from "./renderer.mjs";
import { identity,current,fence } from "./api.mjs";
import { publicProjection,normalize } from "./model.mjs";
import { t } from "./ui.mjs";
export const outputMetrics={captures:0,active:0,urls:0};
export function pdfBytes(jpeg, width, height, orientation) {
  const w = orientation === "landscape" ? 841.8898 : 595.2756,
    h = orientation === "landscape" ? 595.2756 : 841.8898;
  const raw = atob(jpeg.split(",")[1]),
    image = Uint8Array.from(raw, (c) => c.charCodeAt(0)),
    enc = new TextEncoder(),
    chunks = [],
    offsets = [0];
  let length = 0;
  const push = (value) => {
    const bytes = typeof value === "string" ? enc.encode(value) : value;
    chunks.push(bytes);
    length += bytes.length;
  };
  const obj = (n, text, stream) => {
    offsets[n] = length;
    push(`${n} 0 obj\n${text}`);
    if (stream) {
      push("\nstream\n");
      push(stream);
      push("\nendstream");
    }
    push("\nendobj\n");
  };
  push("%PDF-1.4\n%NH7 flattened certificate\n");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  obj(
    3,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
  );
  obj(
    4,
    `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>`,
    image,
  );
  const content = enc.encode(`q\n${w} 0 0 ${h} 0 0 cm\n/Im0 Do\nQ`);
  obj(5, `<< /Length ${content.length} >>`, content);
  const xref = length;
  push("xref\n0 6\n0000000000 65535 f \n");
  for (let i = 1; i <= 5; i++)
    push(String(offsets[i]).padStart(10, "0") + " 00000 n \n");
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  const result = new Uint8Array(length);
  let start = 0;
  for (const bytes of chunks) {
    result.set(bytes, start);
    start += bytes.length;
  }
  return result;
}
export async function pdf(input,{guard}={}) {
  const d=normalize(input),ticket=identity(),check=async()=>{if(guard)await guard();else if(ticket.uid)fence(ticket);if(document.hidden)throw Error('captureError')};
  await check();if(outputMetrics.active)throw Error('captureError');outputMetrics.active++;outputMetrics.captures++;
  const frames=new Set(document.querySelectorAll('iframe.html2canvas-container'));

  if(typeof html2canvas!=="function"){outputMetrics.active--;throw Error("captureError")}
  const page = render(d),
    holder = document.createElement("div");
  holder.style.cssText =
    "position:fixed;left:-10000px;top:0;pointer-events:none";
  holder.append(page);
  document.body.append(holder);
  const busy = document.createElement("div");
  busy.className = "ds2-busy";
  busy.textContent = {
    fa: "در حال آماده‌سازی PDF…",
    en: "Preparing PDF…",
    hr: "Priprema PDF-a…",
  }[d.language];
  document.body.append(busy);
  let timer;
  try {
    const overflow = await ready(page);
    if (overflow.length) throw Error("Text overflow: " + overflow.join(", "));
    await check();
    const capture = html2canvas(page, {
      scale: 2,
      logging: false,
      useCORS: true,
      backgroundColor: d.theme.background,
      scrollX: 0,
      scrollY: 0,
      windowWidth: Math.ceil(page.offsetWidth),
      windowHeight: Math.ceil(page.offsetHeight),
    });
    const canvas = await Promise.race([
      capture,
      new Promise(
        (_, reject) =>
          (timer = setTimeout(
            () =>
              reject(
                Error("PDF timed out; retry after checking images/fonts."),
              ),
            30000,
          )),
      ),
    ]);
    await check();
    if (canvas.width < 100 || canvas.height < 100)
      throw Error("Empty PDF output");
    return new Blob(
      [
        pdfBytes(
          canvas.toDataURL("image/jpeg", 0.97),
          canvas.width,
          canvas.height,
          d.orientation,
        ),
      ],
      { type: "application/pdf" },
    );
  } finally {
    clearTimeout(timer);
    holder.remove();
    busy.remove();outputMetrics.active--;document.querySelectorAll("iframe.html2canvas-container").forEach(frame=>{if(!frames.has(frame))frame.remove()});
  }
}
export async function download(d,options={}) {
  const blob = await pdf(d,options),
    name = (d.verification.number || "New-Hope-7-Draft") + ".pdf",
    file = new File([blob], name, { type: "application/pdf" });
  const save = async () => {
    await options.guard?.();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);outputMetrics.urls++;
    a.download = name;
    a.click();
    const url=a.href;let released=false;const release=()=>{if(released)return;released=true;URL.revokeObjectURL(url);outputMetrics.urls--;removeEventListener("pagehide",release)};addEventListener("pagehide",release,{once:true});setTimeout(release,1000);
  };
  if (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  ) {
    // File is ready before this explicit second gesture, so Safari can Share/Save to Files.
    const labels = {
      fa: ["PDF آماده است", "اشتراک / ذخیره در Files", "دانلود", "بستن"],
      en: ["PDF is ready", "Share / Save to Files", "Download", "Close"],
      hr: ["PDF je spreman", "Podijeli / Spremi u Files", "Preuzmi", "Zatvori"],
    }[d.language];
    const dialog = document.createElement("dialog"),
      heading = document.createElement("h2");
    heading.textContent = labels[0];
    dialog.append(heading);
    if (navigator.canShare?.({ files: [file] })) {
      const share = document.createElement("button");
      share.textContent = labels[1];
      share.onclick = async () => {
        try {
          options.gestureGuard?.();
          await navigator.share({ files: [file], title: name });
          dialog.close();
        } catch (error) {
          if (error.name !== "AbortError") {
            const message = document.createElement("p");
            message.textContent = t("captureError",d.language);
            dialog.append(message);
          }
        }
      };
      dialog.append(share);
    }
    const fallback = document.createElement("button");
    fallback.textContent = labels[2];
    fallback.onclick = save;
    dialog.append(fallback);
    const close = document.createElement("button");
    close.textContent = labels[3];
    close.onclick = () => dialog.close();
    dialog.append(close);
    dialog.addEventListener("close", () => dialog.remove(), { once: true });
    document.body.append(dialog);
    dialog.showModal();const actor=identity(options.scope||'admin');
    const invalid=event=>{if(event?.type==='nh7-public-document-invalidated-v2'||(actor.uid&&actor.uid!=='public'&&!current(actor))||document.hidden)dialog.close()};
    for(const name of ['storage','nh7-personal-owner-wave2','nh7-public-document-invalidated-v2'])addEventListener(name,invalid);document.addEventListener('visibilitychange',invalid);
    dialog.addEventListener('close',()=>{for(const name of ['storage','nh7-personal-owner-wave2','nh7-public-document-invalidated-v2'])removeEventListener(name,invalid);document.removeEventListener('visibilitychange',invalid)},{once:true});

  } else await save();
  return blob;
}
export function openOutput(input,{guard,scope='admin'}={}) {
  guard?.();const d=publicProjection(input);
  const nonce = crypto.randomUUID(),
    url = new URL("document-output.html", location.href);
  url.hash = nonce;
  const child = window.open(url.href, "_blank");
  if (!child) throw Error("popup");
  const listener = (event) => {
    if (
      event.origin !== location.origin ||
      event.source !== child ||
      event.data?.type !== "nh7-document-output-ready" ||
      event.data?.nonce !== nonce
    )
      return;
    try{guard?.()}catch{removeEventListener("message",listener);child.postMessage({type:"nh7-document-output-stale",nonce},location.origin);return}
    child.postMessage(
      { type: "nh7-document-output", nonce, document: d,scope },
      location.origin,
    );
    removeEventListener("message", listener);
  };
  addEventListener("message", listener);
  setTimeout(() => removeEventListener("message", listener), 15000);
  return child;
}
