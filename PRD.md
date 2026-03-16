PRD — yt-Z-downloader
=====================

1. Product Overview

-------------------

**yt-Z-downloader** is a self-hosted YouTube downloading service built on top of **yt-dlp**, using **JSON cookie authentication**, **Python-based backend services**, and **Dockerized deployment**.

The system provides a lightweight web interface and API that allows users to download videos or audio from YouTube and other supported platforms while bypassing bot detection through authenticated browser cookies.

The project is designed to be **portable, reproducible, and secure**, enabling users to run their own private downloader environment.

* * *

2. Objectives
   =============

### Primary Goals

* Provide a **stable interface for yt-dlp downloads**

* Bypass YouTube bot detection using **cookie authentication**

* Offer **simple UI and API for download management**

* Ensure **fully containerized deployment**

* Enable **automated updates and easy maintenance**

### Success Criteria

* Video downloads succeed without manual CLI interaction

* System runs reliably via Docker

* Supports high-quality downloads (up to 4K when available)

* Handles authentication-required videos

* * *

3. Target Users
   ===============

### Primary Users

* Developers running personal download services

* Self-hosted media server enthusiasts

* Researchers needing video dataset extraction

### Secondary Users

* Users who prefer a **Web UI instead of CLI tools**

* Small internal teams needing automated downloads

* * *

4. Key Features
   ===============

4.1 URL Download Interface
--------------------------

Users can submit video URLs through:

* Web interface

* REST API

* CLI integration

Supported platforms include:

* YouTube

* Vimeo

* Twitter/X

* TikTok

* Hundreds of platforms supported by yt-dlp

* * *

4.2 Cookie Authentication System
--------------------------------

The system supports **JSON cookie file loading** to bypass:

* Bot detection

* Age restrictions

* Private content restrictions

Cookie workflow:

1. Export cookies from browser

2. Convert to JSON format

3. Mount into Docker container

4. yt-dlp uses cookie authentication

Example:
    yt-dlp --cookies cookies.json URL

* * *

4.3 Download Format Selection
-----------------------------

Users can select:

* Best quality video

* Specific resolution

* Audio-only downloads

* MP4 merge output

Supported formats:

* MP4

* MKV

* WebM

* MP3

* M4A

* * *

4.4 Download Queue System
-------------------------

The system manages:

* Multiple download jobs

* Queue prioritization

* Progress monitoring

* Failure retry logic

* * *

4.5 Metadata Extraction
-----------------------

The backend extracts and stores:

* Video title

* Channel name

* Duration

* Thumbnail

* Format availability

* Upload date

Metadata stored as JSON for indexing.

* * *

4.6 Download History
--------------------

System maintains a log of:

* Completed downloads

* Failed downloads

* Duplicate detection

* File storage location

* * *

5. System Architecture
   ======================

High-Level Architecture
-----------------------

    User Interface
          │
          ▼
    Python Backend API
          │
          ▼
    Download Manager
          │
          ▼
    yt-dlp Engine
          │
          ▼
    File Storage

* * *

Components
----------

### 1. Web Interface

* Minimal UI

* URL submission

* Download queue view

* Progress monitoring

Technologies:

* HTML

* Tailwind / minimal CSS

* JavaScript

* * *

### 2. Python Backend

Handles:

* API endpoints

* download orchestration

* job queue management

* metadata parsing

Framework options:

* FastAPI (preferred)

* Flask (alternative)

* * *

### 3. yt-dlp Engine

Responsible for:

* media extraction

* format selection

* file merging

* subtitle downloading

Execution triggered by Python subprocess.

Example:
    yt-dlp -f "bv*+ba/b" --merge-output-format mp4

* * *

### 4. Cookie Manager

Loads authentication cookies:
    /cookies/cookies.json

Mounted through Docker volume.

* * *

### 5. File Storage

Downloads stored in:
    /downloads

Organized by:
    /downloads/channel/video_title.ext

* * *

6. Docker Deployment
   ====================

Container Components
--------------------

| Service          | Purpose         |
| ---------------- | --------------- |
| Python API       | Backend service |
| yt-dlp           | Download engine |
| Nginx (optional) | Reverse proxy   |
| Redis (optional) | Job queue       |

* * *

Example docker-compose.yml
--------------------------

    version: "3"
    
    services:
    
      yt-z-downloader:
        build: .
        container_name: yt-z-downloader
        ports:
          - "8080:8080"
        volumes:
          - ./downloads:/downloads
          - ./cookies:/cookies
        restart: unless-stopped

* * *

7. Security Considerations
   ==========================

### Cookie Security

Cookies must:

* remain local

* never be exposed via API

* be mounted read-only

### API Protection

Optional:

* API key authentication

* local network restriction

* rate limiting

* * *

8. Performance Requirements
   ===========================

| Metric                  | Target             |
| ----------------------- | ------------------ |
| Startup time            | < 3 seconds        |
| Download queue capacity | 50 concurrent jobs |
| Memory usage            | < 500MB typical    |
| Maximum file size       | 10GB               |

* * *

9. Error Handling
   =================

System must handle:

* invalid URLs

* geo-blocked content

* removed videos

* download interruptions

* cookie expiration

Retries allowed up to **3 attempts**.

* * *

10. Logging
    ===========

Logs include:

* download events

* yt-dlp output

* errors

* API requests

Stored in:
    /logs

* * *

11. Future Enhancements
    =======================

### Phase 2

* playlist downloading

* automatic channel archiving

* subtitle downloads

* scheduled downloads

* webhook notifications

### Phase 3

* distributed downloader nodes

* proxy rotation

* cloud storage integration

* torrent-style distributed downloads

* * *

12. Repository Structure
    ========================
    
    yt-Z-downloader/
    ├── api/
    │   ├── main.py
    │   ├── downloader.py
    │   └── queue.py
    │
    ├── cookies/
    │   └── cookies.json
    │
    ├── downloads/
    │
    ├── docker/
    │   └── Dockerfile
    │
    ├── docker-compose.yml
    │
    ├── requirements.txt
    │
    └── PRD.md

* * *

13. MVP Scope
    =============

Initial release includes:

* URL submission

* yt-dlp integration

* cookie authentication

* Docker deployment

* simple Web UI

* download history

* * *

14. Non-Goals
    =============

The system will NOT:

* host pirated content publicly

* bypass DRM systems

* support commercial-scale scraping

* provide a public download API

* * *

15. Release Plan
    ================

| Phase | Feature                                    |
| ----- | ------------------------------------------ |
| v0.1  | CLI wrapper + Docker                       |
| v0.2  | Python API                                 |
| v0.3  | Web UI                                     |
| v1.0  | Stable release |
