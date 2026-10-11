import { templates, types, presets, fonts } from "./catalog.mjs";
export const clone = (value) => JSON.parse(JSON.stringify(value));
export const id = () => crypto.randomUUID();
export const elementTypes = [
  "title",
  "subtitle",
  "recipient",
  "body",
  "text",
  "number",
  "student",
  "date",
  "church",
  "contact",
  "photo",
  "logo",
  "qr",
  "verification",
  "signature",
  "signer",
  "role",
  "seal",
  "watermark",
  "line",
  "frame",
  "shape",
  "background",
  "footer",
];
export const protectedTypes = ["title", "recipient", "number", "qr"];
export const pageSize = (orientation) =>
  orientation === "landscape"
    ? { width: 297, height: 210 }
    : { width: 210, height: 297 };
export const safeAsset = (source) =>
  !source ||
  /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(source) ||
  (() => {
    try {
      const u = new URL(source, location.href);
      return (
        u.protocol === "https:" ||
        (u.origin === location.origin &&
          !["javascript:", "data:", "blob:"].includes(u.protocol))
      );
    } catch {
      return false;
    }
  })();
export function fresh({
  template = "classic",
  type = "water_baptism",
  orientation = "portrait",
  language = "fa",
} = {}) {
  const theme = templates.find((t) => t.id === template) || templates[0],
    land = orientation === "landscape",
    size = pageSize(orientation);
  const texts = Object.fromEntries(
    ["fa", "en", "hr"].map((l) => [
      l,
      {
        title: presets(type, l)[0].title,
        subtitle: "",
        body: presets(type, l)[0].body,
        footer: "New Hope Seven Church",
      },
    ]),
  );
  const el = (type, x, y, width, height, binding = "", extra = {}) => ({
    id: id(),
    type,
    name: type,
    x,
    y,
    width,
    height,
    binding,
    text: { fa: "", en: "", hr: "" },
    font: "",
    fontSize: 12,
    fontWeight: 400,
    color: theme.ink,
    background: "transparent",
    borderColor: theme.accent,
    borderWidth: 0,
    radius: 0,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    align: "center",
    lineHeight: 1.5,
    letterSpacing: 0,
    padding: 0,
    fit: "contain",
    focalX: 50,
    focalY: 50,
    zoom: 1,
    ...extra,
  });
  if (type.startsWith("custom_"))
    for (const l of ["fa", "en", "hr"]) {
      texts[l].title = "";
      texts[l].body = "";
    }
  const elements = [
    el("frame", 8, 8, size.width - 16, size.height - 16, "", {
      borderWidth: 0.7,
      frame: theme.frame,
      locked: true,
    }),
    el(
      "watermark",
      size.width * 0.28,
      size.height * 0.3,
      size.width * 0.44,
      size.height * 0.4,
      "logo",
      { opacity: 0.045, visible: false },
    ),
    el("church", land ? 65 : 50, 24, land ? 167 : 110, 20, "churchName", {
      fontSize: 15,
      fontWeight: 700,
    }),
    el("photo", land ? 15 : 13, 19, 31, 38, "photo", {
      visible: false,
      fit: "cover",
      radius: 3,
    }),
    el("logo", size.width - 44, 19, 30, 30, "logo"),
    el("title", land ? 30 : 23, land ? 58 : 68, land ? 237 : 164, 22, "title", {
      fontSize: 24,
      fontWeight: 700,
    }),
    el("subtitle", 25, land ? 81 : 93, size.width - 50, 10, "subtitle", {
      fontSize: 12,
    }),
    el("recipient", 25, land ? 93 : 110, size.width - 50, 18, "recipient", {
      fontSize: 23,
      fontWeight: 700,
    }),
    el("line", 40, land ? 113 : 136, size.width - 80, 0.5, "", {
      background: theme.accent,
    }),
    el("body", 25, land ? 122 : 146, size.width - 50, land ? 35 : 53, "body", {
      fontSize: 12,
      lineHeight: 1.7,
    }),
    el("signer", 25, land ? 163 : 224, 65, 9, "signer", {
      fontSize: 12,
      fontWeight: 700,
    }),
    el("signature", 25, land ? 151 : 209, 65, land ? 10 : 12, "signature", {
      visible: false,
    }),
    el("line", 25, land ? 172 : 236, 65, 0.4, "", { background: theme.accent }),
    el("role", 25, land ? 174 : 241, 65, land ? 7 : 9, "role", {
      fontSize: 10,
    }),
    el(
      "date",
      land ? 104 : 111,
      land ? 164 : 225,
      land ? 64 : 60,
      land ? 8 : 9,
      "issueDate",
      { fontSize: 10 },
    ),
    el(
      "student",
      land ? 174 : 107,
      land ? 164 : 238,
      land ? 64 : 65,
      land ? 8 : 9,
      "studentId",
      { fontSize: 10 },
    ),
    el(
      "number",
      land ? 104 : 20,
      land ? 174 : 251,
      land ? 134 : 137,
      land ? 7 : 8,
      "number",
      { fontSize: 9 },
    ),
    el(
      "verification",
      land ? 104 : 20,
      land ? 182 : 260,
      land ? 134 : 137,
      land ? 7 : 8,
      "verification",
      { fontSize: 8 },
    ),
    el("footer", 18, land ? 182 : 269, land ? 80 : 139, 7, "footer", {
      fontSize: 8,
    }),
    el(
      "contact",
      18,
      land ? 191 : 277,
      land ? 216 : 139,
      land ? 8 : 9,
      "contact",
      { fontSize: 7 },
    ),
    el("qr", size.width - 39, land ? 164 : 251, 25, 25, "qr", {
      background: "#ffffff",
      locked: false,
    }),
  ];
  return {
    design_schema_version: 2,
    id: id(),
    revision: 0,
    status: "draft",
    name: "",
    template,
    type,
    language,
    orientation,
    page: size,
    theme: {
      background: theme.background,
      secondary: theme.background,
      gradient: false,
      ink: theme.ink,
      accent: theme.accent,
    },
    recipient: { name: "", userId: null, email: "", studentId: "", photo: "" },
    church: {
      name: "New Hope Seven Church",
      address: "",
      phone: "",
      email: "",
      website: "https://omideno7church.com",
    },
    assets: {
      logo: "assets/logo.png",
      signature: "",
      seal: "",
      background: "",
    },
    contents: texts,
    signer: "",
    role: "",
    issueDate: new Date().toISOString().slice(0, 10),
    verification: { number: "", token: "", code: "" },
    replaces: null,
    elements,
  };
}
export function normalize(input) {
  if (input?.design_schema_version !== 2)
    throw Error(
      "Unsupported design schema; open legacy records through the compatibility viewer.",
    );
  const d = clone(input);
  for (const language of ["fa", "en", "hr"]) {
    d.contents ??= {};
    d.contents[language] = {
      title: "",
      subtitle: "",
      body: "",
      footer: "",
      ...d.contents[language],
    };
  }
  d.page = pageSize(d.orientation);
  if (
    !["portrait", "landscape"].includes(d.orientation) ||
    !["fa", "en", "hr"].includes(d.language) ||
    !types.some((t) => t.id === d.type)
  )
    throw Error("Invalid document language/type");
  if (
    !Array.isArray(d.elements) ||
    d.elements.length > 100 ||
    new Set(d.elements.map((e) => e.id)).size !== d.elements.length
  )
    throw Error("Invalid element identity/count");
  for (const e of d.elements) {
    if (
      protectedTypes.includes(e.type) &&
      e.binding !==
        { title: "title", recipient: "recipient", number: "number", qr: "qr" }[
          e.type
        ]
    )
      throw Error("Invalid protected binding");
    if (!elementTypes.includes(e.type)) throw Error("Unsupported element");
    for (const p of [
      "x",
      "y",
      "width",
      "height",
      "fontSize",
      "rotation",
      "opacity",
      "borderWidth",
      "padding",
      "lineHeight",
      "letterSpacing",
      "focalX",
      "focalY",
      "zoom",
    ])
      if (!Number.isFinite(e[p])) throw Error("Invalid geometry/style");
    if (e.src && !safeAsset(e.src)) throw Error("Unsafe image");
    if (e.font && !fonts.includes(e.font)) throw Error("Unsupported font");
    for (const p of ["color", "background", "borderColor"])
      if (!/^(#[0-9a-f]{3,8}|transparent)$/i.test(e[p] || ""))
        throw Error("Invalid color");
  }
  for (const key of ["background", "secondary", "ink", "accent"])
    if (!/^#[0-9a-f]{3,8}$/i.test(d.theme?.[key] || ""))
      throw Error("Invalid theme");
  for (const src of [...Object.values(d.assets || {}), d.recipient?.photo])
    if (!safeAsset(src)) throw Error("Unsafe asset URL");
  return d;
}
export function cleanIdentity(input) {
  const d = clone(input);
  d.id = id();
  d.revision = 0;
  d.status = "draft";
  d.recipient = { name: "", userId: null, email: "", studentId: "", photo: "" };
  d.verification = { number: "", token: "", code: "" };
  d.replaces = null;
  delete d.issuedId;
  delete d.issuedAt;
  delete d.revokedAt;
  d.issueDate = new Date().toISOString().slice(0, 10);
  for (const e of d.elements)
    if (e.type === "photo") {
      delete e.src;
      e.visible = false;
    }
  return d;
}
export function templateOnly(input) {
  const d = cleanIdentity(input);
  d.name = input.name || "Custom template";
  return d;
}
export function selectRecipient(input, recipient) {
  const d = clone(input);
  d.recipient = {
    name: String(recipient.name || ""),
    userId: recipient.user_id || null,
    email: String(recipient.email || ""),
    studentId: String(recipient.student_code || ""),
    photo: "",
  };
  for (const e of d.elements)
    if (e.type === "photo") {
      delete e.src;
      e.visible = false;
    }
  return d;
}
export function bounds(e) {
  const rad = (e.rotation * Math.PI) / 180,
    w = Math.abs(e.width * Math.cos(rad)) + Math.abs(e.height * Math.sin(rad)),
    h = Math.abs(e.width * Math.sin(rad)) + Math.abs(e.height * Math.cos(rad));
  return {
    x: e.x + (e.width - w) / 2,
    y: e.y + (e.height - h) / 2,
    width: w,
    height: h,
  };
}
export function preflight(d) {
  const errors = [];
  if (!d.recipient.name.trim()) errors.push("recipient");
  if (!d.contents[d.language]?.title?.trim()) errors.push("title");
  if (!d.signer.trim()) errors.push("signer");
  if (
    types.find((t) => t.id === d.type)?.requiresStudent &&
    !d.recipient.studentId
  )
    errors.push("student");
  for (const type of protectedTypes)
    if (!d.elements.some((e) => e.type === type && e.visible))
      errors.push("required:" + type);
  for (const e of d.elements.filter((e) => e.visible)) {
    const b = bounds(e);
    if (
      b.x < 0 ||
      b.y < 0 ||
      b.x + b.width > d.page.width + 0.001 ||
      b.y + b.height > d.page.height + 0.001
    )
      errors.push("bounds:" + e.name);
    if (
      e.type === "qr" &&
      (e.width !== e.height || e.width < 15 || e.width > 60 || e.opacity !== 1)
    )
      errors.push("qr");
    if (e.font && !fonts.includes(e.font)) errors.push("font");
  }
  if (d.status !== "draft") errors.push("immutable");
  return [...new Set(errors)];
}
export class History {
  constructor(document) {
    this.value = normalize(document);
    this.undoStack = [];
    this.redoStack = [];
  }
  commit(next) {
    next = normalize(next);
    if (JSON.stringify(next) === JSON.stringify(this.value)) return;
    this.undoStack.push(clone(this.value));
    if (this.undoStack.length > 100) this.undoStack.shift();
    this.redoStack = [];
    this.value = next;
  }
  undo() {
    if (!this.undoStack.length) return;
    this.redoStack.push(this.value);
    this.value = this.undoStack.pop();
  }
  redo() {
    if (!this.redoStack.length) return;
    this.undoStack.push(this.value);
    this.value = this.redoStack.pop();
  }
}
export function legacyDraft(row) {
  const d = fresh({
    type: types.some((t) => t.id === row.certificate_type)
      ? row.certificate_type
      : "custom_document",
    language: ["fa", "en", "hr"].includes(row.language) ? row.language : "fa",
    orientation: row.layout === "landscape" ? "landscape" : "portrait",
  });
  for (const l of ["fa", "en", "hr"])
    d.contents[l] = {
      title: row["title_" + l] || d.contents[l].title,
      subtitle: row["designation_" + l] || "",
      body: row["body_" + l] || "",
      footer: "",
    };
  d.recipient = {
    name: row.user_name || "",
    email: row.user_email || "",
    userId: row.recipient_user_id || null,
    studentId: row.student_code || "",
    photo: row.photo_url || "",
  };
  d.assets.logo = row.logo_url || d.assets.logo;
  d.church = { ...d.church, ...row.church_info };
  d.signer = row.approved_by || row.minister || "";
  d.issueDate = row.issue_date || d.issueDate;
  d.elements.find((e) => e.type === "photo").visible = !!d.recipient.photo;
  return d;
}
