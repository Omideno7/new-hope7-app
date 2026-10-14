const assert = require("node:assert/strict"),
  fs = require("node:fs");
const { pathToFileURL } = require("node:url");
const { database, ADMIN, A, B } = require("./document-studio-v2/database.cjs");
global.location = {
  href: "https://fixture.invalid/",
  origin: "https://fixture.invalid",
};
(async () => {
  const {
    fresh,
    preflight,
    History,
    cleanIdentity,
    templateOnly,
    selectRecipient,
    normalize,
  } = await import(
    pathToFileURL(process.cwd() + "/js/document-studio-v2/model.mjs")
  );
  const { templates, types, presets } = await import(
    pathToFileURL(process.cwd() + "/js/document-studio-v2/catalog.mjs")
  );
  let models = 0;
  for (const template of templates)
    for (const type of types)
      for (const language of ["fa", "en", "hr"])
        for (const orientation of ["portrait", "landscape"]) {
          const d = fresh({
            template: template.id,
            type: type.id,
            language,
            orientation,
          });
          d.recipient = {
            name: "Test Recipient",
            userId: A,
            email: "private@example.test",
            studentId: "NH7-S-101",
            photo: "",
          };
          d.signer = "Test Signer";
          if (type.id.startsWith("custom"))
            d.contents[language].title = "Custom Document";
          assert.deepEqual(preflight(d), []);
          assert.equal(presets(type.id, language).length, 3);
          normalize(d);
          models++;
        }
  const d = fresh({ language: "en", type: "course_completion" });
  d.recipient = {
    name: "Alex Example",
    email: "private@example.test",
    userId: A,
    studentId: "FORGED",
    photo: "",
  };
  d.signer = "Test Signer";
  const h = new History(d);
  const next = structuredClone(d);
  next.elements[0].x = 9;
  h.commit(next);
  h.undo();
  assert.equal(h.value.elements[0].x, 8);
  h.redo();
  assert.equal(h.value.elements[0].x, 9);
  const clean = cleanIdentity({
    ...d,
    verification: { token: "issued", number: "issued", code: "issued" },
  });
  assert.equal(clean.recipient.name, "");
  assert.equal(clean.recipient.userId, null);
  assert.equal(clean.verification.token, "");
  assert.notEqual(clean.id, d.id);
  assert.equal(templateOnly(d).recipient.email, "");
  assert.equal(
    selectRecipient(
      { ...d, recipient: { ...d.recipient, photo: "old" } },
      { name: "B", user_id: B },
    ).recipient.photo,
    "",
  );
  const { db, rpc, baseline } = await database();
  try {
    for (const uid of [null, A, B])
      for (const name of [
        "nh7_document_capabilities_v2",
        "nh7_document_admin_list_v2",
        "nh7_document_recipients_v2",
      ])
        await assert.rejects(() => rpc(name, {}, uid));
    await assert.rejects(() => rpc("nh7_my_documents_v2", {}, null));
    const save = await rpc("nh7_document_save_draft_v2", {
      p_document: d,
      p_revision: 0,
    });
    assert.equal(save.revision, 1);
    await assert.rejects(() =>
      rpc("nh7_document_save_draft_v2", { p_document: d, p_revision: 0 }),
    );
    const number = await rpc("nh7_document_reserve_number_v2", {
      p_id: d.id,
      p_revision: 1,
    });
    assert.equal(
      await rpc("nh7_document_reserve_number_v2", {
        p_id: d.id,
        p_revision: 1,
      }),
      number,
    );
    const issued = await rpc("nh7_document_issue_v2", {
      p_id: d.id,
      p_revision: 1,
    });
    assert.equal(issued.student_code, "NH7-S-101");
    assert.equal(issued.certificate_number, number);
    assert.equal(issued.recipient_user_id, A);
    assert.equal(issued.recipient_email, "alex@example.test");
    assert.equal(
      (await rpc("nh7_document_issue_v2", { p_id: d.id, p_revision: 0 })).id,
      issued.id,
    );
    await assert.rejects(() =>
      rpc("nh7_document_save_draft_v2", { p_document: d, p_revision: 1 }),
    );
    assert.equal(
      await rpc("nh7_document_delete_draft_v2", { p_id: d.id }),
      false,
    );
    const verified = await rpc(
      "nh7_document_verify_v2",
      { p_token: issued.public_token },
      null,
    );
    assert.equal(verified.status, "valid");
    const publicText = JSON.stringify(verified);
    for (const forbidden of [
      "private@example.test",
      "alex@example.test",
      A,
      "userId",
      "recipient_email",
      "created_by",
      "replaces",
    ])
      assert.ok(!publicText.includes(forbidden), forbidden);
    assert.equal(
      (
        await rpc(
          "nh7_document_verify_v2",
          { p_token: "33333333-3333-3333-3333-333333333333" },
          null,
        )
      ).status,
      "not_found",
    );
    assert.equal((await rpc("nh7_my_documents_v2", {}, A)).documents.length, 0);
    await rpc("nh7_document_deliver_v2", { p_id: issued.id });
    await rpc("nh7_document_deliver_v2", { p_id: issued.id });
    assert.equal((await rpc("nh7_my_documents_v2", {}, A)).documents.length, 1);
    assert.equal((await rpc("nh7_my_documents_v2", {}, B)).documents.length, 0);
    await db.exec("begin;set local role authenticated");
    await assert.rejects(() =>
      db.query("select * from nh7_official_documents_v2"),
    );
    await db.exec("rollback");
    const revoked = await rpc("nh7_document_revoke_v2", {
      p_id: issued.id,
      p_reason: "Correction required",
    });
    const again = await rpc("nh7_document_revoke_v2", {
      p_id: issued.id,
      p_reason: "Overwrite attempt",
    });
    assert.equal(again.revocation_reason, revoked.revocation_reason);
    assert.equal(again.revoked_at, revoked.revoked_at);
    const rev = await rpc(
      "nh7_document_verify_v2",
      { p_token: issued.public_token },
      null,
    );
    assert.equal(rev.status, "revoked");
    assert.ok(!rev.document);
    await assert.rejects(() =>
      rpc("nh7_document_deliver_v2", { p_id: issued.id }),
    );
    assert.equal(
      (await rpc("nh7_my_documents_v2", {}, A)).documents[0].document.status,
      "revoked",
    );
    const tmpl = templateOnly(d);
    await rpc("nh7_document_save_template_v2", {
      p_name: "Clean Template",
      p_definition: tmpl,
    });
    await assert.rejects(() =>
      rpc("nh7_document_save_template_v2", {
        p_name: "Unsafe",
        p_definition: d,
      }),
    );
    for (const malformed of [
      null,
      {},
      { ...d, language: null },
      { ...d, type: "unknown" },
      { ...d, theme: { ...d.theme, background: "url(https://evil.test)" } },
    ])
      await assert.rejects(() =>
        rpc("nh7_document_save_draft_v2", {
          p_document: malformed,
          p_revision: 0,
        }),
      );
    const forged = cleanIdentity(d);
    forged.recipient = { ...d.recipient, userId: B, studentId: "NH7-S-101" };
    await rpc("nh7_document_save_draft_v2", {
      p_document: forged,
      p_revision: 0,
    });
    await assert.rejects(() =>
      rpc("nh7_document_issue_v2", { p_id: forged.id, p_revision: 1 }),
    );
    assert.deepEqual(
      (await db.query("select * from school_certificates")).rows,
      baseline.rows,
    );
    await db.query(
      "update nh7_official_documents_v2 set expires_at=now()-interval '1 day' where id=$1",
      [issued.id],
    );
    assert.equal(
      (
        await rpc(
          "nh7_document_verify_v2",
          { p_token: issued.public_token },
          null,
        )
      ).status,
      "revoked",
    );
    assert.equal(
      (await rpc("nh7_my_documents_v2", {}, A)).documents[0].status,
      "revoked",
    );
    // These additive FKs must not block the existing account-deletion path.
    await db.query("delete from auth.users where id=$1", [A]);
    assert.equal(
      (
        await db.query(
          "select recipient_user_id from nh7_official_documents_v2 where id=$1",
          [issued.id],
        )
      ).rows[0].recipient_user_id,
      null,
    );
    assert.equal(
      (
        await db.query(
          "select count(*)::integer n from nh7_document_deliveries_v2",
        )
      ).rows[0].n,
      0,
    );
    console.log(
      `PASS ${models} model combinations; undo/redo, identity reset, 3 presets/type/language; real PostgreSQL admin/anon/UID ACLs, revision checks, stable number, idempotent immutable issue, canonical Student ID, public allow-list, delivery isolation, revoke history, malformed input, legacy preservation.`,
    );
  } finally {
    await db.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
