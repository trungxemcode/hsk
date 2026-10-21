# Mobile lesson chat

The chat launcher is hidden while its panel is open and restored on close. Scoped 16px input rules override the studio's 14px rule to avoid Safari focus zoom without disabling pinch zoom. VisualViewport resize/scroll keeps the panel above the software keyboard. Questions render immediately; an inline progress ring replaces the blocking overlay. Input remains usable while awaiting a response, drafts are retained, and completion never refocuses or reopens a closed panel.

Validation: tools/check-chat-mobile-ui.cjs exercises 390/844/1440px, launcher state, computed font, emulated focus scale, immediate messages, pending close, and inline loading. Chromium emulation does not prove physical iOS keyboard behavior. Rebased onto 3.9.0 for release 3.9.1 after discovering PR #132 was never merged. Static feature preservation passes; local browser execution is blocked by missing Chromium and failed browser downloads. CI must verify browser behavior before merge.

Backend generation latency has not been benchmarked or changed. The current server already uses exact-response caching; the first generated response still depends on provider timing. No live API calls or changes to TTS automation were made.
