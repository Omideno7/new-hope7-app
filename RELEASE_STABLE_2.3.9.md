# New Hope 7 — Stable Web Release 2.3.9

## Stable entry points

- User app: `https://omideno7.github.io/new-hope7-app/app-v239.html?release=stable-2.3.9`
- Admin panel: `https://omideno7.github.io/new-hope7-app/admin-v239-stable.html?release=stable-2.3.9`
- Video admin: `https://omideno7.github.io/new-hope7-app/admin-v239-stable.html?tab=videos&release=stable-2.3.9`
- School audio admin: `https://omideno7.github.io/new-hope7-app/admin-v239-stable.html?tab=schoolaudio&release=stable-2.3.9`

## Application identity

- Product name: New Hope 7
- Android package ID currently used by the project owner: `com.omideno7.newhope7`
- Production web origin: `https://omideno7.github.io`
- Production path: `/new-hope7-app/`

## Stable media features

- Private school audio upload and playback
- Independent secure video portal
- Video upload formats: MP4, MOV, M4V, WebM, MKV, AVI, MPEG, MPG, OGV and 3GP
- Original video files are uploaded without transcoding
- SRT/VTT subtitles for English and Croatian
- Account/device-bound access codes with revocation
- Fullscreen player, seek, speed and mute controls
- Restrained moving account/device watermark
- Readable in-app books generated from PDF or DOCX text

## Store packaging boundary

This repository is the production web application. A Google Play AAB or Apple App Store IPA requires the existing Android/iOS wrapper project, signing credentials and store accounts. Those native binary projects and signing secrets are not stored in this repository.

## Required final device test

1. Admin scroll remains stable in every tab.
2. The `Videos` tab is visible next to `School audio`.
3. Upload one short MP4 and confirm it appears in the saved video list.
4. Generate an access code and unlock the user video portal.
5. Confirm fullscreen, normal view, seek, speed, mute and captions.
6. Confirm the watermark stays in the four corners and does not cover the center.
7. Confirm school audio still plays.
8. Confirm one PDF/DOCX can be saved as an in-app readable book.
9. Confirm student activity analytics open from the student profile.

## Recommended store codec

Files may be uploaded without conversion, but MP4 with H.264 video and AAC audio provides the widest playback compatibility on Android and iOS.
