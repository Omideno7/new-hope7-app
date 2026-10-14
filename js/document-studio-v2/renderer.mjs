import { normalize } from "./model.mjs";
export const publicURL = (token) =>
  "https://omideno7.github.io/new-hope7-app/document-verify.html?token=" +
  encodeURIComponent(token);
const printedLabels = {
  fa: {
    student: "شناسه دانشجو",
    number: "شماره مدرک",
    verification: "کد تأیید",
    date: "تاریخ",
  },
  en: {
    student: "Student ID",
    number: "Document number",
    verification: "Verification",
    date: "Date",
  },
  hr: {
    student: "ID polaznika",
    number: "Broj dokumenta",
    verification: "Provjera",
    date: "Datum",
  },
};
const caption = (d, key, value) =>
  value ? printedLabels[d.language][key] + ": " + value : "";
const binding = (e, d) =>
  ({
    title: d.contents[d.language].title,
    subtitle: d.contents[d.language].subtitle,
    body: d.contents[d.language].body,
    footer: d.contents[d.language].footer,
    recipient: d.recipient.name,
    photo: d.recipient.photo,
    studentId: caption(d, "student", d.recipient.studentId),
    number: caption(d, "number", d.verification.number || "—"),
    verification: caption(d, "verification", d.verification.code || "—"),
    issueDate: caption(d, "date", d.issueDate),
    churchName: d.church.name,
    contact: [
      d.church.address,
      d.church.phone,
      d.church.email,
      d.church.website,
    ]
      .filter(Boolean)
      .join(" · "),
    logo: d.assets.logo,
    signer: d.signer,
    role: d.role,
    signature: d.assets.signature,
    seal: d.assets.seal,
    background: d.assets.background,
  })[e.binding] ??
  (e.text?.[d.language] || e.text?.en || "");
export function render(definition, { editor = false } = {}) {
  const d = normalize(definition),
    page = document.createElement("div");
  page.className = "ds2-page";
  page.dataset.schema = "2";
  page.lang = d.language;
  page.dir = d.language === "fa" ? "rtl" : "ltr";
  Object.assign(page.style, {
    width: d.page.width + "mm",
    height: d.page.height + "mm",
    backgroundColor: d.theme.background,
    backgroundImage: d.theme.gradient
      ? `linear-gradient(135deg,${d.theme.background},${d.theme.secondary})`
      : "none",
    color: d.theme.ink,
  });
  for (const e of d.elements.filter((e) => e.visible)) {
    const el = document.createElement("div");
    el.className = "ds2-element ds2-" + e.type;
    el.dataset.element = e.id;
    el.dataset.kind = e.type;
    el.dataset.logical = JSON.stringify([e.x, e.y, e.width, e.height]);
    if (editor) {
      el.tabIndex = 0;
      el.setAttribute("role", "button");
      el.setAttribute("aria-label", e.name);
    }
    Object.assign(el.style, {
      left: e.x + "mm",
      top: e.y + "mm",
      width: e.width + "mm",
      height: e.height + "mm",
      transform: `rotate(${e.rotation}deg)`,
      opacity: e.opacity,
      fontFamily:
        '"' +
        (e.font || (d.language === "fa" ? "Vazirmatn" : "Lora")) +
        '", Vazirmatn',
      fontSize: e.fontSize + "pt",
      fontWeight: e.fontWeight,
      fontStyle: e.italic ? "italic" : "normal",
      textDecoration: e.underline ? "underline" : "none",
      lineHeight: e.lineHeight,
      letterSpacing: e.letterSpacing + "pt",
      textAlign: e.align,
      color: e.color,
      backgroundColor: e.background,
      padding: e.padding + "mm",
      border:
        e.borderWidth +
        "mm " +
        (e.dashed ? "dashed" : "solid") +
        " " +
        e.borderColor,
      borderRadius: e.radius + "mm",
      boxShadow: e.shadow ? "0 1mm 3mm #0002" : "none",
    });
    const value = e.src || binding(e, d);
    if (
      ["photo", "logo", "watermark", "seal", "background"].includes(e.type) ||
      (e.type === "signature" && e.binding)
    ) {
      if (value) {
        const image = document.createElement("canvas");
        image.className = "ds2-image";
        image.dataset.image = value;
        image.dataset.crop = JSON.stringify({
          fit: e.fit,
          x: e.focalX,
          y: e.focalY,
          zoom: e.zoom,
        });
        const density = Math.max(
          2,
          512 / ((Math.max(e.width, e.height) * 96) / 25.4),
        );
        image.width = Math.max(
          1,
          Math.round(((e.width * 96) / 25.4) * density),
        );
        image.height = Math.max(
          1,
          Math.round(((e.height * 96) / 25.4) * density),
        );
        image.setAttribute("role", "img");
        image.setAttribute(
          "aria-label",
          e.type === "photo" ? d.recipient.name : e.type,
        );
        el.append(image);
      }
    } else if (e.type === "qr") {
      const canvas = document.createElement("canvas");
      canvas.className = "ds2-qr";
      canvas.width = canvas.height = 768;
      if (d.verification.token) {
        canvas.dataset.url = publicURL(d.verification.token);
      } else {
        el.textContent = {
          fa: "QR پس از صدور",
          en: "QR after issue",
          hr: "QR nakon izdavanja",
        }[d.language];
        el.classList.add("ds2-qr-placeholder");
      }
      el.append(canvas);
    } else if (e.type === "frame") {
      el.classList.add("ds2-frame-" + (e.frame || "minimal"));
      if (
        e.frame === "double" ||
        e.frame === "classic" ||
        e.frame === "academic"
      ) {
        const inner = document.createElement("div");
        inner.className = "ds2-inner-frame";
        inner.style.borderColor = e.borderColor;
        el.append(inner);
      }
    } else if (!["line", "shape", "signature"].includes(e.type))
      el.textContent = String(value || "");
    page.append(el);
  }
  if (["draft", "revoked", "expired"].includes(d.status)) {
    const mark = document.createElement("div");
    mark.className = "ds2-revoked";
    mark.textContent = {
      draft: { fa: "پیش‌نویس", en: "DRAFT", hr: "SKICA" },
      revoked: { fa: "لغوشده", en: "REVOKED", hr: "PONIŠTENO" },
      expired: { fa: "منقضی", en: "EXPIRED", hr: "ISTEKLO" },
    }[d.status][d.language];
    page.append(mark);
  }
  return page;
}
export async function ready(page) {
  const deadline = (promise) => {
    let timer;
    return Promise.race([
      promise,
      new Promise(
        (_, reject) =>
          (timer = setTimeout(
            () =>
              reject(
                Error(
                  "Document assets timed out. Check images/fonts and retry.",
                ),
              ),
            15000,
          )),
      ),
    ]).finally(() => clearTimeout(timer));
  };
  const families = [
    ...new Set(
      [...page.querySelectorAll(".ds2-element")].map(
        (el) => el.style.fontFamily,
      ),
    ),
  ];
  await deadline(
    Promise.all(families.map((font) => document.fonts.load("12pt " + font))),
  );
  await deadline(document.fonts.ready);
  await deadline(
    Promise.all(
      [...page.querySelectorAll("canvas[data-image]")].map(async (canvas) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(Error("Image failed to load"));
          img.src = canvas.dataset.image;
        });
        const crop = JSON.parse(canvas.dataset.crop),
          ctx = canvas.getContext("2d"),
          w = canvas.width,
          h = canvas.height;
        const ratio =
          (crop.fit === "cover"
            ? Math.max(w / img.width, h / img.height)
            : Math.min(w / img.width, h / img.height)) * crop.zoom;
        const iw = img.width * ratio,
          ih = img.height * ratio;
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(
          img,
          ((w - iw) * crop.x) / 100,
          ((h - ih) * crop.y) / 100,
          iw,
          ih,
        );
        canvas.toDataURL();
      }),
    ),
  );
  await deadline(
    Promise.all(
      [...page.querySelectorAll("canvas[data-url]")].map((canvas) => {
        if (!window.NH7DocumentQRCode) throw Error("QR renderer unavailable");
        return window.NH7DocumentQRCode.toCanvas(canvas, canvas.dataset.url, {
          width: 768,
          margin: 4,
          errorCorrectionLevel: "H",
          color: { dark: "#000000", light: "#ffffff" },
        }).then(() => {
          canvas.style.width = "100%";
          canvas.style.height = "100%";
        });
      }),
    ),
  );
  const overflow = [...page.querySelectorAll(".ds2-element")]
    .filter(
      (el) =>
        (!el.querySelector("img,canvas") &&
          el.scrollHeight > el.clientHeight + 2) ||
        el.scrollWidth > el.clientWidth + 2,
    )
    .map((el) => el.dataset.kind);
  return overflow;
}
export function fit(page, viewport, zoom = "fit") {
  const px = 96 / 25.4,
    w = parseFloat(page.style.width) * px,
    h = parseFloat(page.style.height) * px,
    scale =
      zoom === "fit"
        ? Math.min(1, Math.max(0.1, (viewport.clientWidth - 24) / w))
        : Number(zoom);
  page.style.transform = `scale(${scale})`;
  page.style.transformOrigin = "top left";
  let holder = page.parentNode;
  holder.style.width = w * scale + "px";
  holder.style.height = h * scale + "px";
  return scale;
}
