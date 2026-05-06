# Changelog

All notable changes to Streamline are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.1.0](https://github.com/Isuruzenith/Streamline/compare/v1.0.0...v1.1.0) (2026-05-06)


### Features

* add package metadata reading and npm version check before publi… ([2abaa64](https://github.com/Isuruzenith/Streamline/commit/2abaa64d546f7be09e78c2edb96b1dda0a240e2c))
* add package metadata reading and npm version check before publishing ([b92c34e](https://github.com/Isuruzenith/Streamline/commit/b92c34ec5f7b7d4d2fb076cb3200704e718a2a6e))
* update release workflow to trigger on published releases and ad… ([9efce2e](https://github.com/Isuruzenith/Streamline/commit/9efce2e8f341b5383f79cbbaec3f7b2d22498a09))
* update release workflow to trigger on published releases and adjust package name in config ([0a8a723](https://github.com/Isuruzenith/Streamline/commit/0a8a72363fb87d8ad68fde2cbc2fe13636de48dd))


### Bug Fixes

* update bootstrap SHA in release configuration ([063a9df](https://github.com/Isuruzenith/Streamline/commit/063a9df2057417224b6197c614fd578c0f59297b))
* update bootstrap SHA in release configuration ([6bc828e](https://github.com/Isuruzenith/Streamline/commit/6bc828e2623230181f6b16ce20f826d674d2912c))

## [1.0.0] - 2026-05-05

### Added
- Initial stable release
- Download queue with drag-to-reorder, pause, resume, and retry
- Real-time progress tracking with fragment-aware percentage calculation
- Live yt-dlp logs streamed via WebSocket with polling fallback
- Format picker with resolution presets and custom format selection
- Playlist support with per-entry selection
- Dark and light theme toggle with localStorage persistence
- Download history with persistent storage
- Cookie authentication for age-restricted content
- Advanced options: subtitles, SponsorBlock, metadata embedding, rate limiting
- Custom yt-dlp flags support
- Browser notifications on download complete
- Environment health panel with one-click dependency repair
- npx-compatible - run without installation

### Fixed
- Fragment download progress now shows cumulative percentage (not per-fragment 0-100%)
- Live logs now correctly receive all yt-dlp output via WebSocket
- WebSocket stale closure bug - handleMessage ref kept current across re-renders
- Queue stall on synchronous startDownload() error (processNext try/finally)
- WS reconnect no longer leaks event handlers from previous socket

### Technical
- Backend: Bun + Elysia with WebSocket at /ws
- Frontend: React 19 + Zustand 5 + Tailwind CSS 3 + Vite 6
- Temp file management with automatic cleanup
- Metadata cache with 15-minute TTL
