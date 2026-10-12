# Recommended Features for Rwanda Context

## Core Enhancements (High Priority)

| Feature | Description | Implementation | Priority |
|---|---|---|---|
| **Video/Audio Calling with ASL Overlay** | 1:1 WebRTC video calls with real-time ASL avatar overlay/captions for Deaf users. Show avatar when Deaf mode is active. | Use `simple-peer` or native WebRTC + Socket.IO signaling. Add call buttons in chat header. | High |
| **Kinyarwanda + Swahili Support** | Rwanda uses Kinyarwanda, English, French. Add Kinyarwanda text-to-speech/STT, translations, and UI localization. | Integrate browser TTS with Kinyarwanda voices or Azure/Google; add i18n (react-i18next). | High |
| **SMS/USSD Fallback** | Many users have basic phones or low data. Allow text-based relay via SMS gateway (Africa's Talking) for critical comms. | Add SMS bridge: user can receive/push messages via shortcode. | High |
| **Offline Caching** | Cache messages, pictograms, and phrases for low-connectivity areas. | Use Service Worker + IndexedDB (PWA). Cache ARASAAC symbols. | High |
| **Group Rooms** | Extend from 1:1 to family/community support groups (with role-based permissions). | Update schema: Conversation can have multiple participants (max configurable). | High |

## Accessibility-Specific (Critical)

| Feature | Description | Implementation | Priority |
|---|---|---|---|
| **Sign Language Dictionary** | Curated common Kinyarwanda signs glossary with videos/animations. Helps learning and fallback. | Add `/dictionary` page with searchable terms, link to local SL resources. | High |
| **Real-time Captions for Video** | Auto-generate captions in calls; transcripts saved for later. | Web Speech API for speech→text during calls. Show caption overlay. | High |
| **Haptic Feedback** | Vibrate on incoming calls/messages for Deaf/HoH or attention. | Use Vibration API (mobile). Respect user prefs. | Medium |
| **Emergency Button** | Quick SOS with location + pre-set contacts (critical in rural areas). | Geolocation API + SMS/call to emergency contacts. | High |
| **Easy Mode UI** | Extra-large buttons, fewer options, voice-guided UI for cognitive users. | Add "Easy mode" toggle in settings. | High |

## Community & Localization

| Feature | Description | Implementation | Priority |
|---|---|---|---|
| **Interpreter Matching** | Connect users to certified Rwandan sign language interpreters on-demand. | Add interpreter role, booking system, availability, rating. | High |
| **Volunteer Network** | Allow trained volunteers to assist (with verification). | User roles: user/interpreter/volunteer/admin. | Medium |
| **Public Info Hub** | Share disability rights, services, clinics in Rwanda (Rwanda National Union of the Deaf, NCPD resources). | Static content page with categorized resources. | Medium |
| **Data-Light Mode** | Compress media, disable auto-load avatars in low bandwidth. | Detect connection via `navigator.connection`; toggle features. | High |

## Tech Implementation Notes

**WebRTC Video Calls**
- Backend: extend Socket.IO with `call:initiate`, `call:offer`, `call:answer`, `call:ice-candidate`, `call:end`
- Frontend: `useWebRTC` hook with camera/mic access
- ASL: show avatar panel prominently for Deaf caller; captions overlay for others

**Kinyarwanda TTS/STT**
- Browser: limited. Consider [Coqui TTS](https://github.com/coqui-ai/TTS) self-hosted or [Google Cloud TTS](https://cloud.google.com/text-to-speech) with Kinyarwanda support check
- Free first: try Web Speech API with `lang="rw"` if available; fallback to English

**PWA for offline**
- Add `manifest.json`, service worker for caching messages/symbols
- Workbox or custom SW

**Rwanda-specific APIs**
- Africa's Talking (SMS/USSD) - has Rwanda coverage
- MTN/Airtel integrations where relevant

## Quick Wins (Implement Next)

1. **WebRTC 1:1 video call** - Biggest UX boost for real conversation
2. **Kinyarwanda UI** - Critical for adoption
3. **PWA + offline** - Rural connectivity
4. **Emergency/SOS** - Safety
5. **Interpreter matching** - Bridges gap to existing services

Start with video calls + ASL overlay - directly addresses your request.
