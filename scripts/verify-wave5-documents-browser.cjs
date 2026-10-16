// Real renderer/editor/PDF plus isolated PostgreSQL RPCs. All external network blocked.
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path"),
  { execFileSync } = require("node:child_process");
const { chromium } = require("playwright");
const { database, ADMIN, A, B } = require("./document-studio-v2/database.cjs");
const base = process.argv[2] || "http://127.0.0.1:8878";
assert.match(base, /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/);
const out = fs.mkdtempSync(path.join(os.tmpdir(), "nh7-studio-v2-")),
  token = (uid) =>
    "fixture." +
    Buffer.from(JSON.stringify({ sub: uid,exp:4102444800 })).toString("base64url") +
    ".fixture";
(async () => {
  const { db, rpc, baseline } = await database();
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: "block",
    acceptDownloads: true,
  });
  let errors = [],
    delaySave = 0;
  try {
    await context.addInitScript(
      ({ admin, a }) => {
        localStorage.setItem("nh7_admin_token", admin);window.NH7_DOCUMENT_STUDIO_V2_BACKEND_READY=true;
        if (!localStorage.getItem("nh7_user_session_v170"))
          localStorage.setItem(
            "nh7_user_session_v170",
            JSON.stringify({
              access_token: a,
              user: { id: "00000000-0000-0000-0000-000000000002" },
            }),
          );
        localStorage.setItem("nh7_lang", "en");
      },
      { admin: token(ADMIN), a: token(A) },
    );
    await context.route("**/*", async (route) => {
      const req = route.request(),
        url = req.url();
      if (url.startsWith(base + "/")) return route.continue();
      if (url.startsWith("data:")) return route.continue();
      const m = /\/rest\/v1\/rpc\/([\w]+)$/.exec(url);
      if (m) {
        try {
          const jwt = req.headers().authorization?.split(" ")[1];
          const uid = jwt
            ? JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString())
                .sub
            : null;
          if (m[1] === "nh7_document_save_draft_v2" && delaySave)
            await new Promise((resolve) => setTimeout(resolve, delaySave));
          const result = await rpc(m[1], req.postDataJSON() || {}, uid);
          return route.fulfill({
            contentType: "application/json",
            body: JSON.stringify(result),
          });
        } catch (e) {
          return route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({ message: e.message }),
          });
        }
      }
      return route.abort();
    });
    context.setDefaultTimeout(15000);
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("dialog", (d) => d.accept("QA reason"));
    console.log("QA bootstrap");
    await page.goto(base + "/document-studio.html");
    await page.waitForFunction(() => NH7DocumentStudioV2.controller.canWrite);
    const ctl = () => page.evaluate(() => NH7DocumentStudioV2.snapshot());
    await page.locator("#recipientSelect").selectOption("1"); // Sorted fixture inserts Admin, Alex, Blair.
    assert.equal((await ctl()).recipient.userId, A);
    console.log("QA upload");
    const brand = page
      .locator("#left details")
      .filter({ has: page.locator('[data-upload="photo"]') });
    await brand.locator("summary").click();
    await page.locator('[data-field="signer"]').fill("Church Representative");
    await page.locator('[data-field="signer"]').dispatchEvent("change");
    const image = fs.readFileSync("assets/logo.png");
    await page.locator('[data-upload="photo"]').setInputFiles({
      name: "photo.png",
      mimeType: "image/png",
      buffer: image,
    });
    await page.waitForFunction(() =>
      NH7DocumentStudioV2.snapshot().recipient.photo.startsWith("data:"),
    );
    await page.locator('[data-upload="logo"]').setInputFiles({
      name: "logo.png",
      mimeType: "image/png",
      buffer: image,
    });
    await page.waitForFunction(
      () =>
        NH7DocumentStudioV2.snapshot().recipient.photo.startsWith("data:") &&
        NH7DocumentStudioV2.snapshot().assets.logo.startsWith("data:"),
    );
    let d = await ctl();
    assert.ok(d.assets.logo.startsWith("data:"));
    // Dragging and precise controls use millimetres, not viewport coordinates.
    await page.locator(".ds2-photo").click();
    await page.locator('[data-scope="element"][data-field="x"]').fill("15");
    await page
      .locator('[data-scope="element"][data-field="x"]')
      .dispatchEvent("change");
    await page.locator('[data-action="save"]').click();
    await page.waitForFunction(
      () =>
        !NH7DocumentStudioV2.controller.saving &&
        document.querySelector("#saveStatus").textContent === "Saved",
    );
    d = await ctl();
    const draftID = d.id;
    await page.locator('[data-action="new"]').first().click();
    assert.equal((await ctl()).recipient.photo, "");
    assert.equal((await ctl()).recipient.userId, null);
    await page.evaluate(() => NH7DocumentStudioV2.controller.action("records"));
    await page
      .locator(`[data-action="record:view"][data-id="${draftID}"]`)
      .click();
    d = await ctl();
    assert.ok(d.recipient.photo.startsWith("data:"));
    assert.ok(d.assets.logo.startsWith("data:"));
    assert.equal(d.elements.find((e) => e.type === "photo").x, 15);
    console.log("QA reopen");
    const before = JSON.stringify(d.contents);
    for (const language of ["fa", "en", "hr", "en"]) {
      await page.locator(`[data-action="language:${language}"]`).click();
      assert.equal(JSON.stringify((await ctl()).contents), before);
    }
    const geometry = JSON.stringify((await ctl()).elements);
    for (const [width, height] of [
      [390, 844],
      [430,932],
      [844, 390],
      [768, 1024],
      [820,1180],
      [1024, 768],
      [1280,900],
      [1440, 1000],
    ]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(60);
      assert.equal(JSON.stringify((await ctl()).elements), geometry);
      assert.ok(
        await page.locator(".ds2-page").evaluate((p) => {
          const r = p.getBoundingClientRect(),
            v = p.closest(".ds2-viewport").getBoundingClientRect();
          return r.width <= v.width + 1;
        }),
        "scale-to-fit " + width,
      );
    }
    console.log("QA issue");
    await page.setViewportSize({ width: 1440, height: 1000 });
    delaySave = 180;
    await page.evaluate(() => {
      const c = NH7DocumentStudioV2.controller;
      c.save().catch((e) => c.error(e));
      const next = NH7DocumentStudioV2.snapshot();
      next.contents.en.subtitle = "Latest confirmed draft";
      c.commit(next);
    });
    await page.locator('[data-action="issue"]').click();
    await page.waitForSelector("#confirmDialog[open]");
    assert.ok((await ctl()).verification.number);
    await page.locator('[data-action="issueConfirm"]').click();
    await page.waitForFunction(
      () =>
        NH7DocumentStudioV2.snapshot().status === "issued" ||
        document.querySelector("#error").textContent,
    );
    await page.waitForTimeout(100);
    assert.equal(await page.locator("#error").textContent(), "");
    d = await ctl();
    const row = (await rpc("nh7_document_admin_list_v2")).issued[0];
    assert.equal(row.recipient_user_id, A);
    assert.equal(row.definition.contents.en.subtitle, "Latest confirmed draft");
    delaySave = 0;
    // Current privacy contract: public proof is status-only, authorized archive uses the same renderer.
    console.log("QA minimal public proof / private canonical renderer");
    const publicPage=await context.newPage();await publicPage.goto(base+"/document-verify.html?token="+row.public_token);await publicPage.waitForSelector('.ds2-badge');
    assert.equal(await publicPage.locator('.ds2-page').count(),0);assert.equal(await publicPage.locator('#pdf,#print').count(),0);
    for(const secret of ['alex@example.test','Alex Example',row.recipient_user_id])assert.ok(!(await publicPage.content()).includes(secret));
    const privatePage=await context.newPage();await privatePage.goto(base+'/my-documents.html');await privatePage.waitForSelector('[data-action="view"]');await privatePage.locator('[data-action="view"]').first().click();await privatePage.waitForSelector('.ds2-page');
    await privatePage.waitForFunction(()=>document.querySelector('canvas[data-url]')?.getContext('2d').getImageData(0,0,768,768).data.some(v=>v));
    assert.deepEqual(await privatePage.locator('[data-logical]').evaluateAll(ns=>ns.map(n=>n.dataset.logical)),d.elements.filter(e=>e.visible).map(e=>JSON.stringify([e.x,e.y,e.width,e.height])));
    assert.equal(await page.locator('canvas[data-image]').first().evaluate(n=>n.toDataURL()),await privatePage.locator('canvas[data-image]').first().evaluate(n=>n.toDataURL()),'Editor/authorized recipient image pixels identical');
    await publicPage.screenshot({path:path.join(out,'minimal-public-proof.png')});
    const qr=await privatePage.evaluate(()=>{const c=document.querySelector('canvas[data-url]');return{url:c.dataset.url,width:c.width,height:c.height,pixels:Array.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data)}});
    const jsQR=require('jsqr');assert.equal(jsQR(Uint8ClampedArray.from(qr.pixels),qr.width,qr.height).data,qr.url);assert.ok(qr.url.includes(row.public_token));assert.deepEqual([...new URL(qr.url).searchParams.keys()],['token']);
    // Dedicated top-level print page: explicit direct gesture and action fallback.
    const popupPromise = page.waitForEvent("popup");
    await page.locator('[data-action="print"]').click();
    const output = await popupPromise;
    await output.waitForSelector(".ds2-page");
    await output.waitForFunction(
      () => !document.querySelector("#print").disabled,
    );
    await output.evaluate(() => {
      window.__prints = 0;
      window.print = () => window.__prints++;
    });
    await output.locator("#print").click();
    assert.equal(await output.evaluate(() => window.__prints), 1);
    assert.ok(await output.locator("#message").textContent());
    await output.close();
    // Complete 6-case actual raster/PDF matrix, dimensions parsed by Poppler.
    console.log("QA PDFs");
    for (const language of ["fa", "en", "hr"])
      for (const orientation of ["portrait", "landscape"]) {
        const file = path.join(out, `${language}-${orientation}.pdf`);
        const bytes = await page.evaluate(
          async ({ language, orientation }) => {
            const { fresh } = await import("./js/document-studio-v2/model.mjs");
            const { pdf } = await import("./js/document-studio-v2/output.mjs");
            const { render, ready } = await import(
              "./js/document-studio-v2/renderer.mjs"
            );
            const d = fresh({ language, orientation });
            d.recipient.name =
              language === "fa" ? "شخص آزمون" : "Example Recipient";
            d.signer =
              language === "fa" ? "نماینده کلیسا" : "Church Representative";
            d.status = "issued";
            d.verification = {
              number: "NH7-D-2026-000010",
              token: "12345678-1234-1234-1234-123456789012",
              code: "A1B2C3D4E5F6",
            };
            const p = render(d);
            document.body.append(p);
            const overflow = await ready(p);
            p.remove();
            if (overflow.length) throw Error("Text overflow: " + overflow);
            return Array.from(
              new Uint8Array(await (await pdf(d)).arrayBuffer()),
            );
          },
          { language, orientation },
        );
        fs.writeFileSync(file, Buffer.from(bytes));
        assert.equal(
          fs.readFileSync(file).subarray(0, 8).toString(),
          "%PDF-1.4",
        );
        const info = execFileSync("pdfinfo", [file], { encoding: "utf8" });
        assert.match(info, /Pages:\s+1/);
        assert.match(
          info,
          orientation === "portrait"
            ? /595\.\d+ x 841\.\d+ pts/
            : /841\.\d+ x 595\.\d+ pts/,
        );
        assert.equal(await page.locator(".ds2-busy").count(), 0);
      }
    // Failing capture cleans up, and a subsequent download still works.
    assert.equal(
      await page.evaluate(async () => {
        const { pdf } = await import("./js/document-studio-v2/output.mjs");
        const old = window.html2canvas;
        window.html2canvas = () => Promise.reject(Error("QA capture failure"));
        try {
          await pdf(NH7DocumentStudioV2.snapshot());
          return false;
        } catch (e) {
          return (
            e.message === "QA capture failure" &&
            !document.querySelector(".ds2-busy")
          );
        } finally {
          window.html2canvas = old;
        }
      }),
      true,
    );
    const downloadPromise = page.waitForEvent("download");
    await page.locator('[data-action="pdf"]').click();
    const file = await downloadPromise;
    assert.match(file.suggestedFilename(), /\.pdf$/);
    await file.saveAs(path.join(out, "issued.pdf"));
    await page.evaluate(
      (id) => NH7DocumentStudioV2.controller.recordAction("deliver", id),
      row.id,
    );
    const archive = await context.newPage();
    await archive.goto(base + "/my-documents.html");
    await archive.waitForSelector(".ds2-record");
    assert.ok(
      (await archive.locator("#list").textContent()).includes(
        row.certificate_number,
      ),
    );
    await archive.evaluate(
      ({ t, uid }) => {
        localStorage.setItem(
          "nh7_user_session_v170",
          JSON.stringify({ access_token: t, user: { id: uid } }),
        );
      },
      { t: token(B), uid: B },
    );
    await archive.reload();
    await archive.waitForSelector("#list");
    assert.ok(
      !(await archive.locator("#list").textContent()).includes(
        row.certificate_number,
      ),
    );
    await rpc("nh7_document_revoke_v2", { p_id: row.id, p_reason: "QA" });
    await publicPage.reload();
    await publicPage.waitForSelector(".ds2-badge.revoked");
    assert.equal(await publicPage.locator(".ds2-page").count(), 0);
    assert.match(
      await publicPage.locator(".ds2-badge").textContent(),
      /REVOKED|Revoked|PONIŠTENO|Poništeno/,
    );
    assert.deepEqual(
      (await db.query("select * from school_certificates")).rows,
      baseline.rows,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS actual UI upload → save/reopen → FA/EN/HR → preflight/issue → public QR → PDF/print → UID archive → revoke; six real A4 PDF cases, capture failure cleanup, viewport geometry, legacy records unchanged. Artifacts: " +
        out,
    );
  } finally {
    await context.close();
    await browser.close();
    await db.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
