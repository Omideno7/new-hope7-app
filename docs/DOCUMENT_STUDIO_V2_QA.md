# Studio V2 acceptance evidence

**Manual/native acceptance pending.** Automated browser tests do not certify WKWebView print sheets or real-device visual output. Do not merge/deploy until the operator records results and explicitly approves.

## Safe reproduction

Use an isolated/staging database with the reviewed V2 SQL, seeded test Admin and two canonical test accounts. Never use Production for this matrix. Serve this exact PR candidate from a local origin; keep legacy links available. Compare mm coordinates and the same issued snapshot in editor, public, PDF and print. For iPhone/iPad, use the already-approved native wrapper and exact tested Git payload; do not rebuild a historical wrapper or copy unrelated mobile runtime files.

## Automated evidence categories

Model: 720 template/type/language/orientation combinations. Backend: real PostgreSQL roles/ACLs and lifecycle. Browser: actual editor, upload, save/reopen, viewport scaling, multilingual content preservation, issue/public/QR/PDF/print controls/archive/revoke. Legacy browser: six output cases and failure cleanup. These cover portions of the operator flow below; they are **not** checked as manual completion.

## Exact master-spec operator checklist

- [ ] 1. Open Admin Documents Studio V2.
- [ ] 2. Choose: Course Completion Certificate.
- [ ] 3. Select a real/mock safe test recipient.
- [ ] 4. Confirm Student ID appears.
- [ ] 5. Choose New Hope Classic template.
- [ ] 6. Switch to FA.
- [ ] 7. Choose a Persian text preset.
- [ ] 8. Edit title/body.
- [ ] 9. Upload/choose church logo.
- [ ] 10. Upload/select recipient photo.
- [ ] 11. Move photo.
- [ ] 12. Resize photo.
- [ ] 13. Change photo frame.
- [ ] 14. Move logo.
- [ ] 15. Resize logo.
- [ ] 16. Change title font.
- [ ] 17. Change title size.
- [ ] 18. Change title color.
- [ ] 19. Move title vertically.
- [ ] 20. Move a separator line.
- [ ] 21. Change frame/border.
- [ ] 22. Change background color.
- [ ] 23. Enable church logo watermark.
- [ ] 24. Adjust watermark opacity.
- [ ] 25. Move QR.
- [ ] 26. Resize QR.
- [ ] 27. Move Student ID.
- [ ] 28. Move certificate number.
- [ ] 29. Configure footer.
- [ ] 30. Save draft.
- [ ] 31. Close editor.
- [ ] 32. Reopen draft.
- [ ] 33. Confirm EVERY position/style/asset remains exactly correct.
- [ ] 34. Switch to EN.
- [ ] 35. Confirm English content/layout/direction.
- [ ] 36. Switch to HR.
- [ ] 37. Confirm Croatian content/layout/direction.
- [ ] 38. Return to FA.
- [ ] 39. Run preflight.
- [ ] 40. Issue the certificate.
- [ ] 41. Open public verification.
- [ ] 42. Confirm VALID status.
- [ ] 43. Compare public certificate visually to Studio.
- [ ] 44. Download PDF.
- [ ] 45. Compare PDF visually to Studio.
- [ ] 46. Print.
- [ ] 47. Compare Print visually to Studio.
- [ ] 48. Send document to recipient.
- [ ] 49. Login/view recipient app profile.
- [ ] 50. Open My Documents / My Certificates.
- [ ] 51. Confirm certificate appears.
- [ ] 52. Open it.
- [ ] 53. Download/view it.
- [ ] 54. Scan QR.
- [ ] 55. Confirm same public verification.
- [ ] 56. Search Admin by recipient.
- [ ] 57. Search by Student ID.
- [ ] 58. Search by document number.
- [ ] 59. Revoke certificate.
- [ ] 60. Open verification page again.
- [ ] 61. Confirm REVOKED is shown clearly.
- [ ] 62. Create NEW document.
- [ ] 63. Confirm previous recipient/photo/number/token do NOT remain.

## Additional required negative/device checks

- [ ] iPhone/iPad portrait/landscape: touch selection/drag/resize, inspector, fit without horizontal page overflow, native print or visible fallback, Blob/File Save to Files.
- [ ] FA joined glyphs, mixed digits and RTL; EN/HR LTR; paper A4 dimensions and QR scan from the actual printed/downloaded output.
- [ ] Recipient B/anonymous cannot recover recipient A's archive through a direct RPC or URL; public response contains no private email/account/admin UID.
- [ ] Missing reviewed backend: issue disabled with actionable notice; no legacy fallback write.
- [ ] Large/damaged/external image, blocked popup, unavailable font, exhausted browser quota and failed/slow capture: error shown, busy layer removed, retry/Close/Admin remains usable.
- [ ] Legacy numbers/tokens/issued snapshots/public links remain exact; School/registration/exams/assignments/Community/Audio/Notes remain unchanged.
- [ ] Repeat 100+ single-document operations with clean recipient changes before considering any separate batch feature.

Record exact candidate head, devices/OS/browser, reviewer, time, screenshots/PDFs and pass/fail per step. Production application and legacy-removal approval are separate decisions.
