import {
  fresh,
  normalize,
  History,
  clone,
  cleanIdentity,
  templateOnly,
  selectRecipient,
  preflight,
  legacyDraft,
  protectedTypes,
  serialize, revision, publicProjection,
  id,
} from "./model.mjs";
import { templates, types, fonts, presets, palettes } from "./catalog.mjs";
import { render, ready, fit, publicURL, clearReadyCache } from "./renderer.mjs";
import { download, openOutput } from "./output.mjs";
import { rpc, calls, saveLocal, localDrafts, owner, session, identity, current, fence, authorize, ownerProven, aiDraft } from "./api.mjs";
import { t, esc } from "./ui.mjs";
import {capabilities,preparedReceipt,issuedReceipt} from "./issuance.mjs";
const root = document.querySelector("#studio");
class Studio {
  constructor() {
    this.ownerUID = owner();
    this.credential=identity();this.contextEpoch=0;this.readyAbort=null;this.uploadSerial=0;
    this.sessionLocked = false;
    this.history = new History(
      fresh({
        language: ["fa", "en", "hr"].includes(localStorage.getItem("nh7_lang"))
          ? localStorage.getItem("nh7_lang")
          : "en",
      }),
    );
    this.selected = "";
    this.zoom = "fit";
    this.snap = true;
    this.grid = false;
    this.canWrite = false;
    this.revision = 0;
    this.records = { drafts: [], issued: [], legacy: [] };
    this.recipients = [];this.recipientCursor=null;this.recipientQuery="";this.recipientSearchSerial=0;
    this.customTemplates=[];
    this.saveTimer = 0;
    this.saving = null;
    this.dirty = false;
    this.confirmSnapshot = "";
    this.bootstrap();
  }
  get d() {
    return this.history.value;
  }
  get l() {
    return this.d.language;
  }
  word(k) {
    return t(k, this.l);
  }
  button(action, key, extra = "") {
    return `<button type="button" data-action="${action}" ${extra}>${esc(this.word(key))}</button>`;
  }
  field(label, key, value, type = "text", scope = "doc", extra = "") {
    const checked = type === "checkbox" ? (value ? "checked" : "") : "";
    return `<label>${esc(this.word(label))}<input data-field="${key}" data-scope="${scope}" type="${type}" ${type === "checkbox" ? checked : `value="${esc(value ?? "")}"`} ${extra}></label>`;
  }
  select(label, key, value, rows, scope = "doc") {
    return `<label>${esc(this.word(label))}<select data-field="${key}" data-scope="${scope}">${rows.map(([id, name]) => `<option value="${esc(id)}" ${String(id) === String(value) ? "selected" : ""}>${esc(name)}</option>`).join("")}</select></label>`;
  }
  build() {
    document.documentElement.lang = this.l;
    document.documentElement.dir = this.l === "fa" ? "rtl" : "ltr";
    root.innerHTML = `<header class="ds2-toolbar"><a href="admin-v239-stable.html?workspace=1">${esc(this.word("navBack"))}</a><h1>${esc(this.word("studio"))}</h1>${this.button("new", "new")}${this.button("undo", "undo")}${this.button("redo", "redo")}${this.button("preview", "preview")}${this.button("save", "save")}${this.button("issue", "issue", "data-server")}${this.button("pdf", "pdf")}${this.button("print", "print")}${this.button("fullscreen", "fullscreen")}${this.button("inspector", "inspector")}<select id="zoom" aria-label="${esc(this.word("zoom"))}"><option value="fit">${this.word("fit")}</option>${[0.5, 0.75, 1, 1.25, 1.5].map((v) => `<option value="${v}">${v * 100}%</option>`).join("")}</select></header><div class="ds2-status"><span id="saveStatus" role="status"></span><span id="selectionStatus"></span><span id="serviceStatus"></span></div><div class="ds2-layout"><aside class="ds2-panel" id="left"></aside><main class="ds2-viewport" id="viewport"><div class="ds2-scaled" id="scaled"></div></main><aside class="ds2-panel ds2-inspector" id="inspector"></aside></div><dialog id="recordsDialog"></dialog><dialog id="confirmDialog"></dialog><p id="error" class="ds2-error" role="alert"></p>`;
    root.onclick = (e) => {
      const button = e.target.closest("[data-action]");
      if (button) {
        e.preventDefault();
        this.action(button.dataset.action, button.dataset.id).catch((error) =>
          this.error(error),
        );
      }
      const element = e.target.closest("[data-element]");
      if (element && !button) {
        this.selected = element.dataset.element;
        this.inspector();
        this.selection();
      }
    };
    root.onchange = (e) =>
      this.change(e.target).catch((error) => this.error(error));
    root.onpointerdown = (e) => this.startDrag(e);
    root.oncancel=e=>{if(e.target.matches("input[type=file]")){this.uploadSerial++;this.imageAbort?.abort()}};
    root.querySelector("#zoom").value = this.zoom;
    this.resizeObserver?.disconnect();this.resizeObserver=new ResizeObserver(()=>this.fit());this.resizeObserver.observe(root.querySelector('#viewport'));
    root.oninput=e=>{if(e.target.matches('[data-scope="content"],[data-scope="recipient"],[data-scope="church"]'))this.change(e.target).catch(error=>this.error(error))};
    root.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('close',()=>root.querySelector('[data-action="records"]')?.focus()));
    this.left();
    this.inspector();
    if (innerWidth <= 1100) root.querySelector("#inspector").hidden = true;
    this.draw();
    this.status(this.word("unsaved"));
  }
  async bootstrap() {
    root.textContent=t('loading',localStorage.getItem('nh7_lang')||'en');
    try{await authorize();fence(this.credential);try{this.customTemplates=JSON.parse(localStorage.getItem("nh7_document_templates_local_v2:"+owner())||"[]").slice(0,100)}catch{this.customTemplates=[]}this.build()}
    catch{root.textContent=t('adminLogin',localStorage.getItem('nh7_lang')||'en');this.sessionLocked=true;return}
    try{const result=await rpc(calls.capabilities);fence(this.credential);this.canWrite=capabilities(result,this.ownerUID);this.libraryEnabled=result.library_publication===true;if(this.canWrite){await this.reload();const recipients=await rpc(calls.recipients),templates=await rpc(calls.templates);fence(this.credential);this.recipients=recipients.items||[];this.recipientCursor=recipients.next_cursor||null;this.customTemplates=[...templates,...this.customTemplates.filter(local=>!templates.some(t=>t.id===local.id))];this.left()}}
    catch{this.canWrite=false;root.querySelector('#serviceStatus').textContent=this.word('disabled')}
    this.serverButtons();this.bootstrapReady?.();
  }
  ticket(){return{credential:this.credential,epoch:this.contextEpoch,id:this.d.id}}
  valid(t){return !this.sessionLocked&&current(t.credential)&&t.epoch===this.contextEpoch&&t.id===this.d.id}
  check(t){if(!this.valid(t))throw Error('sessionChanged')}
  switchContext(){this.libraryParent=null;this.contextEpoch++;this.uploadSerial++;this.imageAbort?.abort();this.readyAbort?.abort();this.dragCleanup?.();clearTimeout(this.saveTimer);clearReadyCache();this.confirmSnapshot='';this.prepared=null}
  lockSession(){if(this.sessionLocked)return;this.sessionLocked=true;this.switchContext();this.resizeObserver?.disconnect();this.dirty=false;this.aiProposal=null;this.records={drafts:[],issued:[],legacy:[]};this.recipients=[];this.customTemplates=[];this.history=new History(fresh());this.credential={uid:"",jwt:"",mode:"admin"};this.ownerUID="";this.canWrite=false;root.inert=false;root.replaceChildren(Object.assign(document.createElement('p'),{textContent:t('adminLogin',localStorage.getItem('nh7_lang')||'en')}))}
  serverButtons() {
    root
      .querySelectorAll("[data-server]")
      .forEach(
        (button) =>
          (button.disabled = !this.canWrite || this.d.status !== "draft"),
      );
  }
  status(text, error = false) {
    if(!root.querySelector("#saveStatus"))return;
    root.querySelector("#saveStatus").textContent = text;
    root.querySelector("#saveStatus").className = error ? "ds2-error" : "";
  }
  error(error) {
    if(error?.name==="AbortError"||!root.querySelector("#error"))return;
    root.querySelector("#error").textContent =
      t(error?.message in Object.assign({}, {sessionChanged:1,conflict:1,denied:1,assetLimit:1,assetError:1,captureError:1,templateIdentity:1,reviewChanged:1,disabled:1,aiUnavailable:1,libraryBoundary:1,popup:1,noDraftDelete:1,issueUnverified:1})?error.message:"serviceError",this.l);
    this.status(this.word("error"), true);
  }
  commit(value, { rebuild = false } = {}) {
    if(this.sessionLocked||!current(this.credential))throw Error("sessionChanged");
    if (this.d.status !== "draft") throw Error(this.word("immutable"));
    if(serialize(value)===serialize(this.d))return;
    this.history.commit(value);
    this.dirty = true;
    this.status(this.word("unsaved"));
    if (rebuild) {
      this.left();
      this.inspector();
    }
    this.draw();
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(
      () => {if(!document.hidden)this.save().catch((error) => this.error(error))},
      1200,
    );
  }
  async save() {
    const ticket=this.ticket();this.check(ticket);if(this.d.status!=='draft')return;
    if(this.saving){await this.saving;this.check(ticket);if(!this.dirty)return}
    const snapshot=clone(this.d),revision=this.revision;this.status(this.word('saving'));
    saveLocal({...snapshot,revision},ticket.credential);
    let completed=false;const flight=(async()=>{if(this.canWrite){const result=await rpc(calls.save,{p_document:snapshot,p_revision:revision});this.check(ticket);this.revision=result.revision}
      this.check(ticket);this.dirty=serialize(this.d)!==serialize(snapshot);saveLocal({...this.d,revision:this.revision},ticket.credential);this.status(this.word(this.canWrite?'saved':'local'));completed=true;
    })();this.saving=flight;
    try{await flight}finally{if(this.saving===flight)this.saving=null;if(completed&&this.valid(ticket)&&this.dirty&&!document.hidden){clearTimeout(this.saveTimer);this.saveTimer=setTimeout(()=>this.save().catch(e=>this.error(e)),1200)}}
  }
  async reload(){const ticket=this.ticket(),records=await rpc(calls.list);this.check(ticket);this.records=records}
  left() {
    const d = this.d,
      header = (key) => `<summary>${esc(this.word(key))}</summary>`,
      textarea = (key, value, scope = "content") =>
        `<label>${esc(this.word(key))}<textarea data-field="${key}" data-scope="${scope}">${esc(value || "")}</textarea></label>`;
    const builtTemplates = templates.map((x) => [x.id, x.name]),
      allTemplates = [
        ...builtTemplates,
        ...this.customTemplates.map((x) => ["custom:" + x.id, x.name]),
      ];
    root.querySelector("#left").innerHTML =
      `<details open>${header("document")}${this.field("name", "name", d.name)}${this.select(
        "type",
        "type",
        d.type,
        types.map((x) => [x.id, x.titles[this.l]]),
      )}${this.select("template", "template", d.template, allTemplates)}<div class="ds2-language-tabs ds2-row" role="tablist" aria-label="${esc(this.word("language"))}">${["fa", "en", "hr"].map((l) => `<button type="button" role="tab" aria-selected="${l === this.l}" data-action="language:${l}" ${d.status !== "draft" ? "disabled" : ""}>${l.toUpperCase()}</button>`).join("")}</div>${this.select(
        "orientation",
        "orientation",
        d.orientation,
        ["portrait", "landscape"].map((x) => [x, this.word(x)]),
      )}${this.button("templateReset", "templateReset")}${this.button("templateSave", "templateSave")}</details>
  <details open>${header("recipient")}<label>${esc(this.word("search"))}<input id="recipientSearch" type="search" maxlength="120" value="${esc(this.recipientQuery)}"></label><div class="ds2-row">${this.button("recipientSearch","searchAccounts",this.canWrite?"":"disabled")}${this.button("recipientNext","nextAccounts",this.canWrite&&this.recipientCursor?"":"disabled")}</div><select id="recipientSelect" aria-label="${esc(this.word("recipient"))}"><option value="">${esc(this.word("manual"))}</option>${this.recipients.map((r, i) => `<option value="${i}" ${r.user_id === d.recipient.userId ? "selected" : ""}>${esc(r.name)} · ${esc(r.student_code)} · ${esc(r.email)}</option>`).join("")}</select>${this.field("name", "name", d.recipient.name, "text", "recipient")}${this.field("email", "email", d.recipient.email, "email", "recipient")}${this.field("student", "studentId", d.recipient.studentId, "text", "recipient", "readonly")}</details>
  <details>${header("content")}${this.select(
    "presets",
    "preset",
    0,
    presets(d.type, this.l).map((x) => [x.id, x.label]),
  )}${this.button("loadPreset", "loadPreset")}${this.button("customPreset", "customPreset")}${["title", "subtitle", "body", "footer"].map((k) => textarea(k, d.contents[this.l][k])).join("")}<div id="customPresets"></div><details><summary>${esc(this.word("ai"))}</summary>${this.button("aiDraft","aiDraft")}${this.button("aiTranslate","aiTranslate")}</details></details>
  <details>${header("elements")}<div class="ds2-row">${["text", "line", "shape", "signature", "signer", "role", "seal", "watermark", "footer", "background"].map((key) => this.button("add:" + key, key)).join("")}</div><label><input type="checkbox" id="snap" ${this.snap ? "checked" : ""}>${esc(this.word("snap"))}</label><label><input type="checkbox" id="grid" ${this.grid ? "checked" : ""}>${esc(this.word("grid"))}</label></details>
  <details>${header("branding")}${["name", "address", "phone", "email", "website"].map((k) => this.field({ name: "church", email: "churchEmail" }[k] || k, k, d.church[k], "text", "church")).join("")}${this.field("signer", "signer", d.signer)}${this.field("role", "role", d.role)}${["logo", "photo", "signature", "seal", "background"].map((k) => `<label>${esc(this.word(k))}<input type="file" accept="image/png,image/jpeg,image/webp" data-upload="${k}"></label>`).join("")}${this.button("resetLogo", "reset")}${this.button("cancelUpload", "cancelImages")}<div class="ds2-row">${this.field("background", "background", d.theme.background, "color", "theme")}${this.field("color", "ink", d.theme.ink, "color", "theme")}${this.field("borderColor", "accent", d.theme.accent, "color", "theme")}</div>${this.field("background", "secondary", d.theme.secondary, "color", "theme")}${this.field("visible", "gradient", d.theme.gradient, "checkbox", "theme")}<select id="palette" aria-label="${esc(this.word("color"))}"><option value="">${esc(this.word("choose"))}</option>${palettes.map((p, i) => `<option value="${i}">${esc(this.word(p[0]))}</option>`).join("")}</select></details>
  <details>${header("verification")}${this.field("date", "issueDate", d.issueDate, "date")}<p>${esc(this.word("number"))}: ${esc(d.verification.number || "—")}</p><p class="ds2-notice">${esc(this.word("publicNotice"))}</p>${this.button("preflight", "preflight")}</details><details>${header("output")}<p>${esc(this.word("libraryBoundary"))}</p>${this.field("publicResource","publicationTarget",d.publicationTarget==="library","checkbox")}${this.button("library","libraryPublish")}${this.button("resourceRevision","revision")}${this.button("records", "records")}${this.button("refresh", "refresh")}${this.button("new", "new")}${this.button("duplicate", "duplicate")}</details>`;
    root.querySelector("#recipientSearch").oninput = (e) => {
      const q = e.target.value.toLowerCase();
      root
        .querySelectorAll("#recipientSelect option")
        .forEach(
          (o) =>
            (o.hidden = !!o.value && !o.textContent.toLowerCase().includes(q)),
        );
    };
    if (d.status !== "draft")
      root
        .querySelectorAll("#left input,#left textarea,#left select")
        .forEach((n) => (n.disabled = true));
    const presetKey = "nh7_document_presets_v2:" + owner(),
      values = JSON.parse(localStorage.getItem(presetKey) || "[]");
    root.querySelector("#customPresets").replaceChildren(
      ...values
        .filter((x) => x.type === d.type && x.language === this.l)
        .map((p, i) => {
          const b = document.createElement("button");
          b.textContent = p.name;
          b.onclick = () => {
            const next = clone(this.d);
            next.contents[this.l] = { ...next.contents[this.l], ...p.content };
            this.commit(next, { rebuild: true });
          };
          return b;
        }),
    );
    this.serverButtons();
  }
  inspector() {
    const e = this.d.elements.find((x) => x.id === this.selected),
      panel = root.querySelector("#inspector");
    const layers = `<details open><summary>${esc(this.word("layers"))}</summary>${this.d.elements
      .slice()
      .reverse()
      .map(
        (e) =>
          `<div class="ds2-layer">${this.button("select", e.name || e.type, `data-id="${e.id}"`)}<span>${e.locked ? "🔒" : ""}${e.visible ? "" : "○"}</span></div>`,
      )
      .join("")}</details>`;
    if (!e) {
      panel.innerHTML = layers;
      return;
    }
    const label = (key, type = "number") =>
      this.field(
        key,
        key,
        e[key],
        type,
        "element",
        type === "number" ? 'step="0.1"' : "",
      );
    const textTypes = [
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
        "verification",
        "signer",
        "role",
        "footer",
      ],
      imageTypes = [
        "photo",
        "logo",
        "signature",
        "watermark",
        "seal",
        "background",
      ];
    panel.innerHTML = `<h2>${esc(this.word("properties"))}</h2><p>${esc(this.word("geometry"))}</p>${this.field("name", "name", e.name || e.type, "text", "element")}<details open><summary>${esc(this.word("position"))}</summary><div class="ds2-row">${this.field("X", "x", e.x, "number", "element", 'step="0.1"')}${this.field("Y", "y", e.y, "number", "element", 'step="0.1"')}</div><div class="ds2-row">${label("width")}${label("height")}</div>${label("rotation")}<div class="ds2-row">${["left", "center", "right", "top", "middle", "bottom"].map((k) => this.button("align:" + k, k)).join("")}</div></details>
  ${
    textTypes.includes(e.type)
      ? `<details open><summary>${esc(this.word("font"))}</summary>${this.select(
          "font",
          "font",
          e.font || (this.l === "fa" ? "Vazirmatn" : "Lora"),
          fonts.map((f) => [f, f]),
          "element",
        )}${label("fontSize")}${this.select(
          "fontWeight",
          "fontWeight",
          e.fontWeight,
          [400, 600, 700, 900].map((n) => [n, n]),
          "element",
        )}${this.select(
          "align",
          "align",
          e.align,
          ["left", "center", "right", "justify"].map((x) => [x, this.word(x)]),
          "element",
        )}${label("lineHeight")}${label("letterSpacing")}${label("italic", "checkbox")}${label("underline", "checkbox")}${e.type === "text" || !e.binding ? `<textarea data-field="text" data-scope="element">${esc(e.text[this.l])}</textarea>` : ""}</details>`
      : ""
  }
  <details><summary>${esc(this.word("color"))}</summary>${label("color", "color")}${label("background", "color")}${label("borderColor", "color")}${label("borderWidth")}${label("radius")}${label("padding")}${label("opacity")}${label("shadow", "checkbox")}${
    e.type === "frame"
      ? this.select(
          "frame",
          "frame",
          e.frame,
          [
            "minimal",
            "double",
            "classic",
            "modern",
            "academic",
            "ornamental",
          ].map((x) => [x, this.word(x)]),
          "element",
        )
      : ""
  }</details>
  ${
    imageTypes.includes(e.type)
      ? `<details open><summary>${esc(this.word("photo"))}</summary>${this.select(
          "fitImage",
          "fit",
          e.fit,
          ["cover", "contain"].map((x) => [x, this.word(x)]),
          "element",
        )}${label("focalX")}${label("focalY")}${label("zoom")}<label>${esc(this.word("photo"))}<input type="file" accept="image/png,image/jpeg,image/webp" data-upload="element"></label>${this.button("clearImage", "remove")}</details>`
      : ""
  }
  ${label("visible", "checkbox")}${label("locked", "checkbox")}<div class="ds2-row">${["front", "back", "forward", "backward", "duplicateElement", "removeElement", "resetElement"].map((k) => this.button(k, { duplicateElement: "duplicate", removeElement: "remove", resetElement: "reset" }[k] || k)).join("")}</div>${layers}`;
    if (this.d.status !== "draft")
      panel
        .querySelectorAll("input,select,textarea")
        .forEach((n) => (n.disabled = true));
    root.querySelector("#selectionStatus").textContent =
      this.word(e.type) + " · " + (e.name || "");
  }
  selection() {
    root
      .querySelectorAll("[data-element]")
      .forEach((n) =>
        n.classList.toggle("ds2-selected", n.dataset.element === this.selected),
      );
    const old = root.querySelector(".ds2-handle");
    old?.remove();
    const node = [...root.querySelectorAll("[data-element]")].find(
      (n) => n.dataset.element === this.selected,
    );
    if (
      node &&
      this.d.status === "draft" &&
      !this.d.elements.find((e) => e.id === this.selected)?.locked
    ) {
      const handle = document.createElement("span");
      handle.className = "ds2-handle";
      handle.dataset.resize = "1";
      node.append(handle);
    }
  }
  draw() {
    if(this.sessionLocked||document.hidden)return;
    this.readyAbort?.abort();this.readyAbort=new AbortController();
    const page = render(this.d, { editor: true });
    root.querySelector("#scaled").replaceChildren(page);
    root.querySelector("#viewport").classList.toggle("ds2-grid", this.grid);
    root.querySelector("#viewport").classList.add("ds2-editing");
    this.fit();
    this.selection();
    this.serverButtons();
    ready(page,{signal:this.readyAbort.signal})
      .then((overflow) => {
        if (page.isConnected)
          root.querySelector("#error").textContent = overflow.length
            ? this.word("overflow")+": " + overflow.join(", ")
            : "";
      })
      .catch((error) => {
        if (page.isConnected) this.error(error);
      });
  }
  fit() {
    const page = root.querySelector(".ds2-page");
    if (page)
      this.scale = fit(page, root.querySelector("#viewport"), this.zoom);
  }
  async change(node) {
    if (node.id === "zoom") {
      this.zoom = node.value === "fit" ? "fit" : Number(node.value);
      this.fit();
      return;
    }
    if (node.id === "snap") {
      this.snap = node.checked;
      return;
    }
    if (node.id === "grid") {
      this.grid = node.checked;
      this.draw();
      return;
    }
    if (node.dataset.upload) {
      const file = node.files?.[0];
      if (!file) return;
      if (
        file.size > 10000000 ||
        !["image/png", "image/jpeg", "image/webp"].includes(file.type)
      )
        throw Error("assetLimit");
      this.imageAbort?.abort();this.imageAbort=new AbortController();
      const ticket=this.ticket(),uploadSerial=++this.uploadSerial,selected=this.selected;
      const context = this.d.id,
        recipient = JSON.stringify(this.d.recipient),
        kind = node.dataset.upload,
        url = await this.image(file,this.imageAbort.signal);
      if (
        !this.valid(ticket)||uploadSerial!==this.uploadSerial||
        this.d.id !== context ||
        (kind === "element"&&this.selected!==selected)||
        (JSON.stringify(this.d.recipient) !== recipient)
      )
        return;
      const d = clone(this.d);
      if (kind === "photo") {
        d.recipient.photo = url;
        const e = d.elements.find((e) => e.type === "photo");
        e.visible = true;
        delete e.src;
      } else if (kind === "element") {
        d.elements.find((e) => e.id === this.selected).src = url;
      } else {
        d.assets[kind] = url;
        const signature = d.elements.find(
          (e) => e.type === "signature" && e.binding === "signature",
        );
        if (kind === "signature" && signature) signature.visible = true;
        if (
          ["seal", "background"].includes(kind) &&
          !d.elements.some((e) => e.type === kind)
        ) {
          const e = clone(d.elements.find((e) => e.type === "logo"));
          e.id = id();
          e.type = kind;
          e.name = kind;
          e.binding = kind;
          e.x = kind === "background" ? 0 : 30;
          e.y = kind === "background" ? 0 : 200;
          e.width = kind === "background" ? d.page.width : 30;
          e.height = kind === "background" ? d.page.height : 30;
          if (kind === "background") d.elements.unshift(e);
          else d.elements.push(e);
        }
      }
      this.commit(d, { rebuild: true });
      return;
    }
    if (node.id === "recipientSelect") {
      this.switchContext();
      const row = node.value === "" ? {} : this.recipients[Number(node.value)];
      this.commit(selectRecipient(this.d, row), { rebuild: true });
      return;
    }
    if (node.id === "palette") {
      if (node.value === "") return;
      const p = palettes[Number(node.value)],
        d = clone(this.d);
      d.theme.ink = p[1];
      d.theme.accent = p[2];
      for (const e of d.elements) {
        e.color = p[1];
        e.borderColor = p[2];
      }
      this.commit(d, { rebuild: true });
      return;
    }
    const key = node.dataset.field,
      scope = node.dataset.scope;
    if (!key || key === "preset") return;
    const d = clone(this.d),
      value =
        node.type === "checkbox"
          ? node.checked
          : node.type === "number"
            ? Number(node.value)
            : node.value;
    if(key==="publicationTarget"){if(value&&(d.recipient.userId||d.recipient.email||d.recipient.name||d.recipient.studentId))throw Error("libraryBoundary");d.publicationTarget=value?"library":"archive";d.elements.find(e=>e.type==="recipient").visible=!value;this.commit(d,{rebuild:true});return}
    if (key === "language") {
      d.language = value;
      this.commit(d);
      this.build();
      return;
    }
    if (key === "template" || key === "orientation") {
      this.uploadSerial++;this.imageAbort?.abort();this.selected="";
      if (!confirm(this.word("templateReset") + "?")) {
        this.left();
        return;
      }
      let next;
      if (key === "template" && value.startsWith("custom:")) {
        next = cleanIdentity(
          this.customTemplates.find((t) => t.id === value.slice(7)).definition,
        );
        next.recipient = d.recipient;
        next.contents = d.contents;
        next.language = d.language;
        next.id = d.id;
        next.template = value;
      } else {
        next = fresh({
          template: key === "template" ? value : d.template,
          type: d.type,
          orientation: key === "orientation" ? value : d.orientation,
          language: d.language,
        });
        Object.assign(next, {
          id: d.id,
          recipient: d.recipient,
          contents: d.contents,
          church: d.church,
          assets: d.assets,
          signer: d.signer,
          role: d.role,
          issueDate: d.issueDate,
        });
        next.elements.find((e) => e.type === "photo").visible =
          !!d.recipient.photo;
      }
      this.commit(next, { rebuild: true });
      return;
    }
    if (scope === "element") {
      const el = d.elements.find((e) => e.id === this.selected);
      if(el.locked&&!["locked","name"].includes(key))return;
      if (key === "text") el.text[this.l] = value;
      else el[key] = key === "fontWeight" ? Number(value) : value;
      if (el.type === "qr") {
        el.height = el.width;
        el.opacity = 1;
      }
      if (key === "width" || key === "height") {
        el.width = Math.max(0.5, el.width);
        el.height = Math.max(0.5, el.height);
      }
    } else if (scope === "content") d.contents[this.l][key] = value;
    else if (scope === "recipient") {
      d.recipient[key] = value;
      if (key === "name" && !d.recipient.userId) d.recipient.studentId = "";
    } else if (scope === "church" || scope === "theme") {
      if (scope === "theme" && ["ink", "accent"].includes(key)) {
        const old = d.theme[key];
        for (const e of d.elements) {
          if (key === "ink" && e.color === old) e.color = value;
          if (key === "accent") {
            if (e.borderColor === old) e.borderColor = value;
            if (e.type === "line" && e.background === old) e.background = value;
          }
        }
      }
      d[scope][key] = value;
    } else d[key] = value;
    this.commit(d, { rebuild: scope === "element" || key === "type" });
  }
  async image(file,signal) {
    let timer;
    const url = URL.createObjectURL(file);let cancel=()=>{};
    try {
      const img = new Image();
      await Promise.race([
        new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(Error("assetError"));
          cancel=()=>{img.src="";reject(new DOMException("Aborted","AbortError"))};signal?.addEventListener("abort",cancel,{once:true});if(signal?.aborted)return cancel();
          img.src = url;
        }),
        new Promise(
          (_, reject) =>
            (timer = setTimeout(() => reject(Error("Image timed out")), 10000)),
        ),
      ]);
      const ratio = Math.min(1, 1200 / Math.max(img.width, img.height)),
        c = document.createElement("canvas");
      c.width = Math.round(img.width * ratio);
      c.height = Math.round(img.height * ratio);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL(file.type==="image/png"?"image/png":"image/jpeg",0.9);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort",cancel);URL.revokeObjectURL(url);
    }
  }
  startDrag(event) {
    const node = event.target.closest("[data-element]");
    if (!node || this.d.status !== "draft") return;
    const e = this.d.elements.find((e) => e.id === node.dataset.element);
    if (e.locked) return;
    this.selected = e.id;
    this.inspector();
    this.selection();
    event.preventDefault();
    const ticket=this.ticket();
    const before = clone(this.d),
      x = event.clientX,
      y = event.clientY,
      resize = !!event.target.dataset.resize,
      scale = (this.scale * 96) / 25.4;
    const move = (ev) => {
      if(!this.valid(ticket)){this.dragCleanup?.();return}
      const d = clone(before),
        next = d.elements.find((el) => el.id === e.id),
        dx = (ev.clientX - x) / scale,
        dy = (ev.clientY - y) / scale;
      if (resize) {
        next.width = Math.max(next.type === "qr" ? 15 : 5, e.width + dx);
        next.height =
          next.type === "qr" ? next.width : Math.max(5, e.height + dy);
      } else {
        next.x = Math.max(0, Math.min(d.page.width - next.width, e.x + dx));
        next.y = Math.max(0, Math.min(d.page.height - next.height, e.y + dy));
        if (this.snap) {
          next.x =
            Math.abs(next.x + next.width / 2 - d.page.width / 2) < 2
              ? (d.page.width - next.width) / 2
              : Math.round(next.x / 5) * 5;
          next.y =
            Math.abs(next.y + next.height / 2 - d.page.height / 2) < 2
              ? (d.page.height - next.height) / 2
              : Math.round(next.y / 5) * 5;
        }
      }
      this.history.value = d;
      this.draw();
    };
    const up = () => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerup", up);
      removeEventListener("pointercancel", up);
      this.dragCleanup=null;if(!this.valid(ticket))return;
      const after = this.d;
      this.history.value = before;
      this.commit(after, { rebuild: true });
    };
    this.dragCleanup=()=>{removeEventListener("pointermove",move);removeEventListener("pointerup",up);removeEventListener("pointercancel",up)};
    addEventListener("pointermove", move);
    addEventListener("pointerup", up, { once: true });
    addEventListener("pointercancel", up, { once: true });
  }
  async action(action, key) {
    const actionTicket=this.ticket();this.check(actionTicket);
    root.querySelector("#error").textContent = "";
    if(action==='cancelUpload'){this.uploadSerial++;this.imageAbort?.abort();return}
    if(action==='aiDraft'||action==='aiTranslate'){
      const brief=prompt(this.word('aiBrief'));if(!brief)return;
      if([this.d.recipient.name,this.d.recipient.userId,this.d.recipient.email,this.d.recipient.studentId].filter(Boolean).some(v=>brief.includes(v)))throw Error('privateContent');
      const language=this.l,field='body',before=this.d.contents[language][field],proposal=await aiDraft(language,field,brief,action==='aiTranslate');this.check(actionTicket);if(this.l!==language||this.d.contents[language][field]!==before)throw Error('reviewChanged');
      const dialog=root.querySelector('#confirmDialog');dialog.innerHTML=`<h2>${esc(this.word('ai'))}</h2><textarea id="aiProposal" dir="${language==='fa'?'rtl':'ltr'}">${esc(proposal)}</textarea>${this.button('aiAccept','aiAccept')}${this.button('cancelConfirm','cancel')}`;this.aiProposal={ticket:actionTicket,language,field,before};dialog.showModal();return;
    }
    if(action==='aiAccept'){
      const p=this.aiProposal;if(!p)return;this.check(p.ticket);if(this.d.contents[p.language][p.field]!==p.before)throw Error('reviewChanged');const d=clone(this.d);d.contents[p.language][p.field]=root.querySelector('#aiProposal').value;this.commit(d,{rebuild:true});root.querySelector('#confirmDialog').close();this.aiProposal=null;return;
    }
    if(action==='resourceRevision'){if(!this.libraryParent)throw Error("libraryBoundary");const next=revision(this.d,this.libraryParent);this.switchContext();this.history=new History(next);this.revision=0;this.left();this.inspector();this.draw();return}
    if(action==='library'){if(!this.libraryEnabled)throw Error('disabled');const {prepareResource}=await import('./resource.mjs');this.check(actionTicket);const result=await prepareResource(this.d,{guard:()=>this.check(actionTicket),confirm:(plan,snapshot)=>this.confirmLibrary(plan,snapshot,actionTicket)});this.check(actionTicket);if(result.ok&&result.status!=='unknown'){this.libraryParent=result.publication_id;this.history.value={...this.d,status:'issued',verification:result.definition.verification};this.left();this.inspector();this.draw();this.status(this.word('issued'))}else if(result.status==='unknown')throw Error('serviceError');return}
    if (action.startsWith("language:")) {
      await this.change({
        dataset: { field: "language" },
        value: action.slice(9),
      });
      return;
    }
    if (action === "select") {
      this.selected = key;
      this.inspector();
      this.selection();
      return;
    }
    if (action === "inspector") {
      root.querySelector("#inspector").hidden =
        !root.querySelector("#inspector").hidden;
      return;
    }
    if (action === "save") {
      await this.save();
      return;
    }
    if (action === "undo" || action === "redo") {
      if (this.d.status !== "draft") return;
      this.history[action]();
      this.left();
      this.inspector();
      this.draw();
      this.dirty = true;
      this.status(this.word("unsaved"));
      clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(
        () => this.save().catch((e) => this.error(e)),
        1200,
      );
      return;
    }
    if (action === "fullscreen") {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.requestFullscreen();
      return;
    }
    if (action === "preview" || action === "print") {
      openOutput(clone(this.d),{guard:()=>this.check(actionTicket),scope:"admin"});
      return;
    }
    if (action === "pdf") {
      const button = root.querySelector('[data-action="pdf"]');
      button.disabled = true;
      try {
        await download(this.d,{guard:()=>this.check(actionTicket),gestureGuard:()=>this.check(actionTicket)});
      } finally {
        button.disabled = false;
      }
      return;
    }
    if(action==='recipientSearch'||action==='recipientNext'){
      if(!this.canWrite)throw Error('disabled');
      const serial=++this.recipientSearchSerial,query=action==='recipientSearch'?root.querySelector('#recipientSearch').value.trim():this.recipientQuery;
      const selected=this.recipients.find(r=>r.user_id===this.d.recipient.userId);
      const result=await rpc(calls.recipients,{p_query:query,p_after:action==='recipientNext'?this.recipientCursor:null,p_limit:100});
      this.check(actionTicket);if(serial!==this.recipientSearchSerial)return;
      if(!Array.isArray(result?.items)||result.items.length>100)throw Error('serviceError');
      this.recipients=result.items;if(selected&&!this.recipients.some(r=>r.user_id===selected.user_id))this.recipients=[selected,...this.recipients];
      this.recipientCursor=result.next_cursor||null;this.recipientQuery=query;this.left();return;
    }
    if (action === "preflight" || action === "issue") {
      if(this.d.publicationTarget==="library"&&action==="issue")throw Error("libraryBoundary");
      if (this.preparingIssue) return;
      this.preparingIssue = true;
      root.inert = true;
      try {
        if (action === "issue") {
          if (!this.canWrite) throw Error(this.word("disabled"));
          clearTimeout(this.saveTimer);
          await this.save();
          // Awaiting an earlier autosave must not issue its stale snapshot.
          if (this.dirty) await this.save();
          clearTimeout(this.saveTimer);
          if (this.dirty)
            throw Error("Draft is changing. Save and run preflight again.");
        }
        const errors = preflight(this.d),
          overflow = await ready(root.querySelector(".ds2-page"));
        if (errors.length || overflow.length)
          throw Error(
            [...errors, ...overflow.map((t) => "Text overflow: " + t)].join(
              "\n",
            ),
          );
        if (action === "preflight") {
          this.status(this.word("preflight") + " ✓");
          return;
        }
        this.check(actionTicket);
        this.issueRequest=this.issueRequest?.id===this.d.id?this.issueRequest:{id:this.d.id,request:id()};
        const prepared=await rpc(calls.prepare,{p_id:this.d.id,p_revision:this.revision,p_request_id:this.issueRequest.request});this.check(actionTicket);
        this.prepared=preparedReceipt(prepared,this.d);this.history.value={...clone(this.d),recipient:{...this.d.recipient,...prepared.recipient},verification:prepared.verification};
        this.draw();await this.confirmIssue();
      } finally {
        this.preparingIssue = false;
        if(this.valid(actionTicket))root.inert = false;
      }
      return;
    }
    if (action === "issueConfirm") {
      if (this.confirmBusy) return;
      if(!root.querySelector("#confirmDialog")?.open||!this.prepared||!this.confirmSnapshot)throw Error("reviewChanged");
      this.confirmBusy = true;root.inert=true;
      const b = root.querySelector('[data-action="issueConfirm"]');
      b.disabled = true;
      try {
        if (JSON.stringify(this.d) !== this.confirmSnapshot)
          throw Error("Draft changed. Run preflight again.");
        const result = await rpc(calls.issue, {p_id:this.d.id,p_revision:this.revision,p_request_id:this.issueRequest.request,p_prepare_token:this.prepared.prepare_token});this.check(actionTicket);
        issuedReceipt(result,{draft:this.d,prepared:this.prepared,request:this.issueRequest.request});
        try{saveLocal({...this.d,status:'issued'},actionTicket.credential)}catch{/* Server result retained despite local quota */}
        this.history = new History(result.authoring||result.definition);
        this.issuedId = result.id;
        this.dirty = false;
        root.querySelector("#confirmDialog").close();
        this.left();
        this.inspector();
        this.draw();
        this.status(this.word("issued"));
        await this.reload();
      } finally {
        this.confirmBusy = false;root.inert=false;
        if(b.isConnected)b.disabled = false;
      }
      return;
    }
    if (action === "cancelConfirm") {
      root.querySelector("#confirmDialog").close();this.prepared=null;this.confirmSnapshot="";
      return;
    }
    if (action === "new" || action === "duplicate") {
      clearTimeout(this.saveTimer);
      if (this.saving) await this.saving;
      if (this.dirty && !confirm(this.word("unsaved") + "?")) return;
      clearTimeout(this.saveTimer);
      this.check(actionTicket);this.switchContext();
      this.history = new History(
        action === "duplicate"
          ? cleanIdentity(this.d)
          : fresh({ language: this.l }),
      );
      this.revision = 0;
      this.selected = "";
      this.issuedId = null;
      this.dirty = false;
      this.left();
      this.inspector();
      this.draw();
      this.status(this.word("draft"));
      return;
    }
    if (action === "loadPreset") {
      if (!confirm(this.word("loadPreset") + "?")) return;
      const p = presets(this.d.type, this.l)[
          Number(root.querySelector('[data-field="preset"]').value)
        ],
        d = clone(this.d);
      d.contents[this.l].title = p.title;
      d.contents[this.l].body = p.body;
      this.commit(d, { rebuild: true });
      return;
    }
    if (action === "customPreset") {
      const name = prompt(this.word("name"));
      if (!name) return;
      const key = "nh7_document_presets_v2:" + owner(),
        rows = JSON.parse(localStorage.getItem(key) || "[]");
      rows.push({
        name,
        type: this.d.type,
        language: this.l,
        content: clone(this.d.contents[this.l]),
      });
      localStorage.setItem(key, JSON.stringify(rows));
      this.left();
      return;
    }
    if (action === "templateSave") {
      const name = prompt(this.word("name"));
      if (!name) return;
      const template = templateOnly(this.d);
      template.name = name;
      if (this.canWrite) {
        await rpc(calls.template, { p_name: name, p_definition: template });
        this.customTemplates = await rpc(calls.templates);this.check(actionTicket);
      } else {
        const key = "nh7_document_templates_local_v2:" + owner(),
          rows = JSON.parse(localStorage.getItem(key) || "[]");
        rows.push({ id: id(), name, definition: template });
        localStorage.setItem(key, JSON.stringify(rows));
        this.customTemplates = rows;
      }
      this.left();
      return;
    }
    if (action === "templateReset") {
      this.uploadSerial++;this.imageAbort?.abort();this.selected="";
      if (!confirm(this.word("templateReset") + "?")) return;
      const next = fresh({
        template: this.d.template,
        type: this.d.type,
        orientation: this.d.orientation,
        language: this.l,
      });
      Object.assign(next, {
        id: this.d.id,
        recipient: this.d.recipient,
        contents: this.d.contents,
        assets: this.d.assets,
        church: this.d.church,
        signer: this.d.signer,
        role: this.d.role,
      });
      next.elements.find((e) => e.type === "photo").visible =
        !!next.recipient.photo;
      this.commit(next, { rebuild: true });
      return;
    }
    if (action === "resetLogo") {
      const d = clone(this.d);
      d.assets.logo = "assets/logo.png";
      for (const e of d.elements.filter((e) => e.type === "logo")) {
        delete e.src;
        e.visible = true;
      }
      this.commit(d, { rebuild: true });
      return;
    }
    if (action === "records" || action === "refresh") {
      if (this.canWrite) await this.reload();
      this.showRecords();
      return;
    }
    if (action === "closeRecords") {
      root.querySelector("#recordsDialog").close();
      return;
    }
    if (action.startsWith("record:")) {
      await this.recordAction(action.slice(7), key);
      return;
    }
    const d = clone(this.d),
      e = d.elements.find((x) => x.id === this.selected);
    if (action.startsWith("add:")) {
      const type = action.slice(4),
        el = clone(d.elements.find((e) => e.type === "body"));
      Object.assign(el, {
        id: id(),
        type,
        name: this.word(type),
        binding: ["seal", "watermark", "background"].includes(type)
          ? type === "watermark"
            ? "logo"
            : type
          : "",
        text: { fa: "متن", en: "Text", hr: "Tekst" },
        x: 30,
        y: 30,
        width: type === "line" ? 100 : 60,
        height: type === "line" ? 0.5 : 20,
        visible: true,
        locked: false,
      });
      if (type === "line" || type === "shape") el.background = d.theme.accent;
      if (type === "watermark") el.opacity = 0.045;
      d.elements.push(el);
      this.selected = el.id;
      this.commit(d, { rebuild: true });
      return;
    }
    if (!e||e.locked) return;
    if (action.startsWith("align:")) {
      const a = action.slice(6);
      if (a === "left") e.x = 10;
      if (a === "right") e.x = d.page.width - e.width - 10;
      if (a === "center") e.x = (d.page.width - e.width) / 2;
      if (a === "top") e.y = 10;
      if (a === "bottom") e.y = d.page.height - e.height - 10;
      if (a === "middle") e.y = (d.page.height - e.height) / 2;
    } else if (action === "clearImage") {
      delete e.src;
      if (e.type === "photo") d.recipient.photo = "";
      e.visible = false;
    } else if (action === "duplicateElement") {
      if (protectedTypes.includes(e.type)) return;
      const copy = clone(e);
      copy.id = id();
      copy.x = Math.min(d.page.width - copy.width, e.x + 5);
      copy.y = Math.min(d.page.height - copy.height, e.y + 5);
      d.elements.push(copy);
      this.selected = copy.id;
    } else if (action === "removeElement") {
      if (protectedTypes.includes(e.type)) return;
      d.elements = d.elements.filter((x) => x.id !== e.id);
      this.selected = "";
    } else if (action === "resetElement") {
      const original = fresh({
        template: d.template,
        type: d.type,
        orientation: d.orientation,
        language: d.language,
      }).elements.find((x) => x.type === e.type);
      if (original) Object.assign(e, original, { id: e.id });
    } else if (["front", "back", "forward", "backward"].includes(action)) {
      const i = d.elements.indexOf(e);
      d.elements.splice(i, 1);
      d.elements.splice(
        action === "front"
          ? d.elements.length
          : action === "back"
            ? 0
            : action === "forward"
              ? Math.min(d.elements.length, i + 1)
              : Math.max(0, i - 1),
        0,
        e,
      );
    }
    this.commit(d, { rebuild: true });
  }
  async confirmLibrary(plan,snapshot,ticket){
    const dialog=root.querySelector('#confirmDialog');dialog.innerHTML=`<h2>${esc(this.word('libraryPublish'))}</h2>${['fa','en','hr'].map(l=>`<p dir="${l==='fa'?'rtl':'ltr'}">${esc(plan.metadata['title_'+l])}</p>`).join('')}<div class="ds2-viewport"><div class="ds2-scaled"></div></div><button id="libraryAccept" disabled>${esc(this.word('confirm'))}</button><button id="libraryCancel">${esc(this.word('cancel'))}</button>`;
    const page=render(snapshot);dialog.querySelector('.ds2-scaled').append(page);dialog.showModal();const overflow=await ready(page);this.check(ticket);if(overflow.length)throw Error('overflow');fit(page,dialog.querySelector('.ds2-viewport'));dialog.querySelector('#libraryAccept').disabled=false;
    return new Promise(resolve=>{const close=answer=>{dialog.close();resolve(answer)};dialog.querySelector('#libraryAccept').onclick=()=>close(true);dialog.querySelector('#libraryCancel').onclick=()=>close(false);dialog.addEventListener('cancel',()=>resolve(false),{once:true});dialog.addEventListener('close',()=>resolve(false),{once:true})});
  }
  async confirmIssue() {
    const ticket=this.ticket();this.confirmSnapshot = JSON.stringify(this.d);
    const dialog = root.querySelector("#confirmDialog");dialog.oncancel=e=>{if(this.confirmBusy)e.preventDefault();else{this.prepared=null;this.confirmSnapshot=""}};
    dialog.innerHTML = `<h2>${esc(this.word("issue"))}</h2><p>${esc(this.d.recipient.name)} · ${esc(types.find((t) => t.id === this.d.type).titles[this.l])}</p><p>${esc(this.word("student"))}: ${esc(this.d.recipient.studentId || "—")}</p><p>${esc(this.word("date"))}: ${esc(this.d.issueDate)}</p><p>${esc(this.word("number"))}: ${esc(this.d.verification.number || this.word("issued"))}</p><p class="ds2-notice">${esc(this.word("publicNotice"))}</p><div class="ds2-viewport"><div class="ds2-scaled" id="finalPreview"></div></div>${this.button("issueConfirm", "confirm")}${this.button("cancelConfirm", "cancel")}`;
    const page = render(this.prepared.snapshot);
    dialog.querySelector("#finalPreview").append(page);
    dialog.showModal();
    const button=dialog.querySelector('[data-action="issueConfirm"]');button.disabled=true;const overflow=await ready(page);this.check(ticket);if(overflow.length)throw Error("overflow");button.disabled=false;button.focus();
    fit(page, dialog.querySelector(".ds2-viewport"));
  }
  showRecords() {
    const dialog = root.querySelector("#recordsDialog"),
      drafts = [...this.records.drafts.map(r=>({...r,local:false})),...localDrafts().filter(local=>{
        if(this.records.issued.some(row=>row.draft_id===local.id))return false;const remote=this.records.drafts.find(r=>r.id===local.id);return !remote||serialize({...remote.definition,revision:0})!==serialize({...local,revision:0});
      }).map(d=>({id:d.id,list_id:d.id+':local',definition:d,revision:d.revision,local:true}))];
    const issued = [...this.records.issued, ...this.records.legacy,...(this.records.resources||[])];
    dialog.innerHTML = `${this.button("closeRecords", "close")}<h2>${esc(this.word("records"))}</h2><input id="recordSearch" type="search" placeholder="${esc(this.word("search"))}"><div class="ds2-row"><select id="recordStatus"><option value="">${this.word("all")}</option>${["draft", "issued", "revoked", "expired"].map((x) => `<option value="${x}">${this.word(x)}</option>`).join("")}</select><select id="recordType"><option value="">${this.word("all")}</option>${types.map((x) => `<option value="${x.id}">${esc(x.titles[this.l])}</option>`).join("")}</select><select id="recordTemplate"><option value="">${this.word("all")}</option>${templates.map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select><select id="recordLanguage"><option value="">${this.word("all")}</option>${["fa", "en", "hr"].map((x) => `<option>${x}</option>`).join("")}</select></div><label>${this.word("date")}<input id="recordFrom" type="date"><input id="recordTo" type="date"></label><div id="recordList"></div>`;
    const list = dialog.querySelector("#recordList");
    list.innerHTML =
      [...drafts, ...issued]
        .map((r) => {
          const d = r.definition || {},
            isDraft = !!r.definition && d.status === "draft",
            legacy = r.legacy === true,
            search = [
              r.recipient_name,
              r.recipient_email,
              r.student_code,
              r.certificate_number,
              r.public_token,
              r.status,
              d.recipient?.name,
              d.recipient?.email,
              d.recipient?.studentId,
              d.verification?.code,
              d.name,
            ]
              .join(" ")
              .toLowerCase();
          return `<article class="ds2-record" data-search="${esc(search)}" data-status="${isDraft ? "draft" : r.status}" data-type="${esc(d.type || r.certificate_type)}" data-template="${esc(d.template || "")}" data-language="${esc(d.language || r.language)}" data-date="${esc(d.issueDate || r.issue_date || String(r.issued_at || "").slice(0, 10))}"><strong>${esc(d.recipient?.name || r.recipient_name || d.name || this.word("draft"))}</strong>${r.local?`<p>${esc(this.word("recovery"))}</p>`:""}<p>${esc(r.certificate_number || d.verification?.number || "")} · ${esc(r.student_code || d.recipient?.studentId || "")} · ${esc(this.word(r.status || "draft"))}</p>${this.button("record:view", "view", `data-id="${r.list_id||r.id}"`)}${legacy ? "" : isDraft ? this.button("record:delete", "remove", `data-id="${r.list_id||r.id}"`) : ["verify", "copy", "pdf", "print", "deliver", "revoke", "expire", "revision", "duplicate"].map((x) => this.button("record:" + x, x, `data-id="${r.list_id||r.id}"`)).join("")}</article>`;
        })
        .join("") || esc(this.word("empty"));
    const filter = () => {
      const q = dialog.querySelector("#recordSearch").value.toLowerCase(),
        status = dialog.querySelector("#recordStatus").value,
        type = dialog.querySelector("#recordType").value,
        l = dialog.querySelector("#recordLanguage").value,
        template = dialog.querySelector("#recordTemplate").value,
        from = dialog.querySelector("#recordFrom").value,
        to = dialog.querySelector("#recordTo").value;
      list
        .querySelectorAll("article")
        .forEach(
          (n) =>
            (n.hidden =
              !n.dataset.search.includes(q) ||
              (!!status && n.dataset.status !== status) ||
              (!!type && n.dataset.type !== type) ||
              (!!l && n.dataset.language !== l) ||
              (!!template && n.dataset.template !== template) ||
              (!!from && n.dataset.date < from) ||
              (!!to && n.dataset.date > to)),
        );
    };
    dialog
      .querySelectorAll("input,select")
      .forEach((n) => (n.oninput = filter));
    if (!dialog.open) dialog.showModal();
    this.visibleDrafts = drafts;
  }
  async recordAction(action, id) {
    clearTimeout(this.saveTimer);
    if (this.saving) await this.saving;
    const draft = this.visibleDrafts.find((r) => (r.list_id||r.id) === id),
      row = [...this.records.issued, ...this.records.legacy,...(this.records.resources||[])].find(
        (r) => r.id === id,
      );
    if (draft) {
      if(action==='delete')throw Error('noDraftDelete');
      this.check(this.ticket());this.switchContext();
      this.history = new History({
        ...draft.definition,
        verification: {
          ...draft.definition.verification,
          number:
            draft.reserved_certificate_number ||
            draft.definition.verification.number,
        },
      });
      this.revision = draft.revision;
      this.selected = "";
      this.dirty = false;
      root.querySelector("#recordsDialog").close();
      this.left();
      this.inspector();
      this.draw();
      this.status(this.word("saved"));
      return;
    }
    if (!row) return;
    if(row.library&&["revoke","expire","deliver"].includes(action))throw Error("libraryBoundary");
    if (row.legacy) {
      window.open(
        new URL(
          "certificate.html?token=" + encodeURIComponent(row.public_token),
          location.href,
        ),
        "_blank",
      );
      return;
    }
    const actionTicket=this.ticket();const d = clone(row.definition);
    d.status = row.library?(row.status==="published"?"issued":"unknown"):row.status;
    if (action === "verify") window.open(publicURL(row.public_token), "_blank");
    if (action === "copy")
      await navigator.clipboard.writeText(publicURL(row.public_token));
    if (action === "pdf") await download(d,{guard:()=>this.check(actionTicket),gestureGuard:()=>this.check(actionTicket)});
    if (action === "print") openOutput(d,{guard:()=>this.check(actionTicket),scope:"admin"});
    if (action === "deliver") {
      await rpc(calls.deliver, { p_id: id });
      this.status(this.word("deliver") + " ✓");
    }
    if (action === "revoke") {
      const reason = prompt(this.word("reason"));
      if (reason === null) return;
      await rpc(calls.revoke, { p_id: id, p_reason: reason });
      await this.reload();
      this.showRecords();
    }
    if (action === "expire") {
      if(!this.canWrite)throw Error("disabled");
      if(!confirm(this.word("expire")+"?"))return;
      this.check(actionTicket);
      await rpc(calls.expire,{p_id:id,p_expires_at:new Date().toISOString(),p_reason:this.word("expire")});
      this.check(actionTicket);await this.reload();this.showRecords();
    }
    if (action === "duplicate" || action === "revision") {
      const next=action==="revision"?revision(row.authoring||d,row.id,row.recipient_user_id):cleanIdentity(d);this.check(actionTicket);this.switchContext();
      this.history = new History(next);
      this.revision = 0;
      this.selected = "";
      this.dirty = false;
      root.querySelector("#recordsDialog").close();
      this.left();
      this.inspector();
      this.draw();
    }
    if (action === "view") {
      this.check(actionTicket);this.switchContext();this.libraryParent=row.library?row.id:null;this.history = new History(d);
      this.issuedId = row.id;
      this.selected = "";
      this.dirty = false;
      root.querySelector("#recordsDialog").close();
      this.left();
      this.inspector();
      this.draw();
      this.status(this.word(row.status));
    }
  }
}
const studio = new Studio();
window.NH7DocumentStudioV2 = {
  snapshot: () => clone(studio.d),
  controller: studio,
};
document.addEventListener("keydown", (e) => {
  if (
    document.querySelector("dialog[open]") ||
    e.target.closest("input,textarea,select")
  )
    return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    studio.action(e.shiftKey ? "redo" : "undo");
    return;
  }
  if (
    ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key) &&
    studio.selected &&
    studio.d.status === "draft"
  ) {
    const d = clone(studio.d),
      el = d.elements.find((x) => x.id === studio.selected);
    if (el.locked) return;
    e.preventDefault();
    const step = e.shiftKey ? 5 : 1;
    el.x += e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
    el.y += e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
    studio.commit(d, { rebuild: true });
  }
});
addEventListener("beforeunload", (event) => {
  if (studio.dirty) {
    event.preventDefault();
    event.returnValue = "";
  }
});
const checkSession=()=>{if(!current(studio.credential))studio.lockSession()};
for(const name of ['storage','nh7-personal-owner-wave2','nh7-admin-clear-wave3','nh7-session-refreshed','pageshow'])addEventListener(name,checkSession);
document.addEventListener('visibilitychange',()=>{checkSession();if(document.hidden){clearTimeout(studio.saveTimer);studio.readyAbort?.abort()}else if(!studio.sessionLocked){studio.draw();if(studio.dirty)studio.saveTimer=setTimeout(()=>studio.save().catch(e=>studio.error(e)),1200)}});
const nonce = location.hash.slice(1);
if (nonce && window.opener) {
  const accept = (event) => {
    if (
      event.origin !== location.origin ||
      event.source !== window.opener ||
      event.data?.type !== "nh7-studio-v2-import" ||
      event.data?.nonce !== nonce
    )
      return;
    removeEventListener("message", accept);
    if(!ownerProven()||studio.sessionLocked||!current(studio.credential))return;
    const legacy = event.data.document;
    if (legacy.status === "approved" || legacy.public_token) {
      studio.status(studio.word("legacyPreserved"));
      return;
    }
    const imported = legacyDraft(legacy);
    for (const e of imported.elements) {
      const geometry = event.data.layout?.[e.type];
      if (geometry && geometry.width > 0 && geometry.height > 0)
        Object.assign(e, geometry);
    }
    studio.switchContext();studio.history = new History(imported);
    studio.left();
    studio.inspector();
    studio.draw();
    studio.status(studio.word("unsaved"));
  };
  addEventListener("message", accept);
  studio.bootstrapReady=()=>window.opener.postMessage({type:"nh7-studio-v2-ready",nonce},location.origin);
}
