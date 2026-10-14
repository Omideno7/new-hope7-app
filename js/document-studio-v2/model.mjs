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
export const uuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value||'');
export const serialize = value => JSON.stringify((function sorted(v){return Array.isArray(v)?v.map(sorted):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sorted(v[k])])):v})(value));
export const safeAsset = source => !source || typeof source==='string' && source.length<=2000000 && (
 /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(source) ||
 /^assets\/[a-zA-Z0-9_/.-]+\.(png|jpg|jpeg|webp)$/.test(source)&&!source.includes('..') ||
 /^https:\/\/gpzcwffxnddhaeaogdyo\.supabase\.co\/storage\/v1\/object\/public\/(nh7-public-document-assets\/|church-audio\/documents\/)[a-zA-Z0-9_./%-]+$/.test(source)&&!source.includes('..'));
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
    el("body", 25, land ? 122 : 146, size.width - 50, land ? 30 : 53, "body", {
      fontSize: 12,
      lineHeight: 1.7,
    }),
    el("signer", 25, land ? 163 : 224, 65, 9, "signer", {
      fontSize: 12,
      fontWeight: 700,
    }),
    el("signature", 25, land ? 153 : 209, 65, land ? 8 : 12, "signature", {
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
  if(serialize(input).length>3000000)throw Error("assetLimit");
  const known=['design_schema_version','id','revision','status','name','template','type','language','orientation','page','theme','recipient','church','assets','contents','signer','role','issueDate','verification','replaces','elements','publicationTarget'];
  const d=Object.fromEntries(known.filter(k=>input[k]!==undefined).map(k=>[k,clone(input[k])]));
  for (const language of ["fa", "en", "hr"]) {
    d.contents ??= {};
    d.contents[language] = {
      title: "",
      subtitle: "",
      body: "",
      footer: "",
      ...Object.fromEntries(["title","subtitle","body","footer"].filter(k=>d.contents[language]?.[k]!==undefined).map(k=>[k,d.contents[language][k]])),
    };
  }
  d.page = pageSize(d.orientation);
  d.theme=Object.fromEntries(["background","secondary","gradient","ink","accent"].map(k=>[k,d.theme[k]]));
  d.church=Object.fromEntries(["name","address","phone","email","website"].map(k=>[k,d.church?.[k]||""]));
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
  if(d.id&&!uuid(d.id))throw Error("invalidStyle");
  for (const e of d.elements) {
    if(!uuid(e.id))throw Error("invalidStyle");
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
    if(e.width<=0||e.height<=0||e.width>297||e.height>297||e.fontSize<1||e.fontSize>150||e.opacity<0||e.opacity>1||e.zoom<0.1||e.zoom>10||e.focalX<0||e.focalX>100||e.focalY<0||e.focalY>100||e.lineHeight<0.5||e.lineHeight>5||e.padding<0||e.borderWidth<0||e.radius<0||!['left','center','right','justify'].includes(e.align)||!['contain','cover'].includes(e.fit)||typeof e.visible!=='boolean'||typeof e.locked!=='boolean')throw Error('invalidStyle');
    if(e.src&&!["photo","logo","watermark","seal","background","signature"].includes(e.type))throw Error("invalidStyle");
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
  const d = normalize(input);
  const old=[['name','{{recipient}}'],['userId',''],['email',''],['studentId','{{student}}']].map(([key,replacement])=>[input.recipient?.[key],replacement]).concat(Object.values(input.verification||{}).map(value=>[value,''])).filter(([value])=>typeof value==='string'&&value.length>2);
  const redact=text=>old.reduce((s,[value,replacement])=>s.replaceAll(value,replacement),String(text||''));
  d.name=redact(d.name);for(const l of ['fa','en','hr'])for(const key of ['title','subtitle','body','footer'])d.contents[l][key]=redact(d.contents[l][key]);
  for(const e of d.elements){e.name=redact(e.name);for(const l of ['fa','en','hr'])e.text[l]=redact(e.text?.[l]);}

  d.id = id();
  d.revision = 0;
  d.status = "draft";
  d.recipient = { name: "", userId: null, email: "", studentId: "", photo: "" };
  d.verification = { number: "", token: "", code: "" };
  d.replaces = null;
  delete d.issuanceRequest;
  delete d.prepared;
  delete d.privateNotes;
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
  const literals=[input.recipient?.name,input.recipient?.email,input.recipient?.userId,input.recipient?.studentId,input.verification?.number,input.verification?.token,input.verification?.code].filter(v=>typeof v==='string'&&v.length>2);
  const content=serialize({name:d.name,contents:d.contents,elements:d.elements});
  if(literals.some(value=>content.includes(value)))throw Error('templateIdentity');
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
  const library=d.publicationTarget==='library';
  if (!library&&!d.recipient.name.trim()) errors.push("recipient");
  if(library&&(!["official_letter","custom_document"].includes(d.type)||Object.values(d.recipient).some(Boolean)))errors.push("libraryBoundary");
  if (!d.contents[d.language]?.title?.trim()) errors.push("title");
  if (!d.signer.trim()) errors.push("signer");
  if(!d.church?.name?.trim())errors.push('church');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d.issueDate||'')||Number.isNaN(Date.parse(d.issueDate+'T00:00:00Z'))||new Date(d.issueDate+'T00:00:00Z').toISOString().slice(0,10)!==d.issueDate)errors.push('date');
  if(!d.contents[d.language]?.body?.trim())errors.push('body');
  if(d.recipient.userId&&!uuid(d.recipient.userId))errors.push('recipient');
  if(d.recipient.email&&[...Object.values(d.contents).flatMap(c=>Object.values(c)),...d.elements.flatMap(e=>Object.values(e.text||{}))].some(v=>String(v).includes(d.recipient.email)))errors.push('privateContent');
  if (
    !library&&types.find((t) => t.id === d.type)?.requiresStudent &&
    !d.recipient.studentId
  )
    errors.push("student");
  for (const type of protectedTypes.filter(t=>!library||t!=="recipient"))
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
      (e.width !== e.height || e.width < 15 || e.width > 60 || e.opacity !== 1 || e.padding!==0 || e.borderWidth!==0)
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
  const saved=row.design?.studio_v239;
  if(saved){
    if(/^#[0-9a-f]{3,8}$/i.test(saved.paper||''))d.theme.background=saved.paper;
    if(/^#[0-9a-f]{3,8}$/i.test(saved.accent||''))d.theme.ink=saved.accent;
    if(/^#[0-9a-f]{3,8}$/i.test(saved.accent2||''))d.theme.accent=saved.accent2;
    if(saved.photo?.source&&!d.recipient.photo)d.recipient.photo=saved.photo.source;if(saved.logo?.source&&!row.logo_url)d.assets.logo=saved.logo.source;
    const photo=d.elements.find(e=>e.type==='photo'),logo=d.elements.find(e=>e.type==='logo');
    if(saved.photo){photo.zoom=Math.max(.1,Math.min(10,Number(saved.photo.zoom)||1));photo.rotation=Number(saved.photo.rotate)||0;photo.radius=saved.photo.round?Math.min(photo.width,photo.height)*Math.min(50,Number(saved.photo.round))/100:0}
    if(saved.logo){logo.rotation=Number(saved.logo.rotate)||0;logo.opacity=typeof saved.logo.opacity==='number'?saved.logo.opacity:1;logo.radius=saved.logo.round?Math.min(logo.width,logo.height)/2:0}
  }
  d.elements.find((e) => e.type === "photo").visible = !!d.recipient.photo;
  return d;
}

export function revision(input,parent,recipientUID=null){const d=normalize(input);d.id=id();d.status='draft';d.revision=0;d.verification={number:'',token:'',code:''};d.recipient={...clone(input.recipient),userId:recipientUID};d.replaces=parent;return d}
export const elementPublicKeys=['id','type','x','y','width','height','binding','font','fontSize','fontWeight','italic','underline','color','background','borderColor','borderWidth','radius','rotation','opacity','visible','locked','align','lineHeight','letterSpacing','padding','fit','focalX','focalY','zoom','frame','shadow','dashed','src'];
const pick=(o,keys)=>Object.fromEntries(keys.filter(k=>o?.[k]!==undefined).map(k=>[k,clone(o[k])]));
export function publicProjection(input){
 const d=normalize(input),l=d.language,visible=d.elements.filter(e=>e.visible),shown=binding=>visible.some(e=>e.binding===binding);
 return {design_schema_version:2,...pick(d,['language','orientation','type','template','status','signer','role','issueDate']),page:pick(d.page,['width','height']),theme:pick(d.theme,['background','secondary','gradient','ink','accent']),contents:{[l]:pick(d.contents[l],['title','subtitle','body','footer'])},church:pick(d.church,['name','address','phone','email','website']),recipient:{name:d.recipient.name,studentId:shown('studentId')?d.recipient.studentId:'',photo:shown('photo')?d.recipient.photo:''},assets:Object.fromEntries(['logo','signature','seal','background'].filter(shown).map(k=>[k,d.assets[k]||''])),verification:pick(d.verification,['number','token','code']),elements:visible.map(e=>({...pick(e,elementPublicKeys),text:{[l]:e.text?.[l]||''}}))};
}
