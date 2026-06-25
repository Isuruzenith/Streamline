# Changelog

All notable changes to Streamline are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.3.1](https://github.com/Isuruzenith/Streamline/compare/v1.3.0...v1.3.1) (2026-06-25)


### Refactors

* remove FFmpeg dependencies and replace with automated cross-platform provisioning script ([b887262](https://github.com/Isuruzenith/Streamline/commit/b887262748c42c2ee36e4906ee4bef14d141541e))
* remove FFmpeg dependencies and replace with automated cross… ([5889083](https://github.com/Isuruzenith/Streamline/commit/588908332f8b40f6e245cb7f3fedc829c8dc95b5))

## [1.3.0](https://github.com/Isuruzenith/Streamline/compare/v1.2.0...v1.3.0) (2026-06-25)


### Features

* add format selection UI, layout components, and sidebar navigation navigation ([71ef830](https://github.com/Isuruzenith/Streamline/commit/71ef830b3da0b8c804815a824ae7f8e0c43ce6a6))
* implement core backend download queue service with concurrency support and frontend integration architecture ([bf36364](https://github.com/Isuruzenith/Streamline/commit/bf363648b5f38b17861439df9ab0268b9f111e7a))
* implement environment management API and yt-dlp service integration ([67abcf6](https://github.com/Isuruzenith/Streamline/commit/67abcf6afd9cf270f29e055823780e6193500bcd))
* implement UI shell including layout, navigation, and collapsible live log viewer ([1f8d60f](https://github.com/Isuruzenith/Streamline/commit/1f8d60f740d8546e45f2b5bdad71e8db76977eb4))
* implement yt-dlp service with utility functions for download management, metadata caching, and playlist detection ([586334a](https://github.com/Isuruzenith/Streamline/commit/586334a163a0a0bac91a47a130c9fa6e906a58d9))
* initialize project UI components, layout, and global styling with Tailwind CSS ([93e1c9b](https://github.com/Isuruzenith/Streamline/commit/93e1c9b2cfdfd198c6a2d48ba481a2391d65284b))

## [1.2.0](https://github.com/Isuruzenith/Streamline/compare/v1.1.0...v1.2.0) (2026-05-06)


### Features

* add support for checking yt-dlp options in help text and update tests ([4a04d16](https://github.com/Isuruzenith/Streamline/commit/4a04d16993feda706a32f32d1003a5172bcef8c2))
* add support for checking yt-dlp options in help text and update… ([46e8867](https://github.com/Isuruzenith/Streamline/commit/46e8867e2e19db3a82c252070fc56260b569645f))

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
