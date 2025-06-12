# Product Requirements Document (PRD)
# Coaching Event Video Analysis Platform

**Version:** 3.1
**Date:** June 1, 2025
**Status:** Vision Refined - Focused on "Coaching Events" & Content Creation

---

## 1. Introduction & Executive Summary

This document outlines the requirements for the **Coaching Event Video Analysis Platform**, a web-based SaaS application designed to empower sports coaches, analysts, and players with intuitive and powerful tools for video review, tactical analysis, feedback, and content creation.

The platform's core paradigm revolves around **"Coaching Events"** (or "Analysis Points"). Users create singular, rich "Coaching Events" at specific video timestamps. Each event can encapsulate a combination of textual notes, defined playback loops, descriptive tags (including player tags), canvas drawings (telestration), and mentions of specific users, providing a holistic analytical unit. Video controls (play, pause, speed, seek, loop activation, enlarge mode) will be external to the video player itself for consistent interaction across different video sources and to avoid conflicts with overlays. Instead of true browser fullscreen, the platform will offer a controlled "enlarged player mode" that maximizes the video and analysis area while keeping essential application UI accessible.

Beyond internal analysis, the platform will facilitate the creation of video compilations, highlight reels, and other shareable content derived from these Coaching Events, enabling teams and coaches to communicate achievements, development points, and promotional material to a wider audience including parents, families, and social media.

This approach aims to provide a holistic solution, from detailed internal analysis to broader external communication and content showcasing, accessible across desktop, tablet, and mobile devices (with a mobile-first consumption experience for athletes).

## 2. Goals and Objectives

* **Primary Goal:** To provide an intuitive, integrated, and powerful platform for sports teams to analyze video content through "Coaching Events," and to leverage this analysis to create compelling derivative video content, improving tactical understanding, player development, team communication, and promotional outreach.
* Enable coaches to easily create rich, multi-faceted "Coaching Events" combining notes, loops, drawings, and tags for specific video moments, using externalized video controls and a controlled enlarged player mode.
* Allow users to compile "Coaching Events" and video segments into highlight reels and presentations.
* Facilitate seamless sharing of "Coaching Events," full videos, and compiled content within teams and with external stakeholders (parents, social media) with granular permissions.
* Offer a clear and accessible way for athletes (especially on mobile) to review targeted feedback and analysis.
* Establish a scalable foundation for future enhancements like AI-driven insights, advanced analytics, and broader sport-specific customizations.
* Provide a B2B SaaS solution that is valuable and accessible to sports organizations of various sizes.

## 3. Target Audience

* **Primary Users (Content Creators/Analysts):**
    * **Coaches (Head Coaches, Assistant Coaches):** Analyzing game/training footage, creating tactical breakdowns, providing player feedback, compiling player highlights or team reels.
    * **Video Analysts/Coordinators:** Detailed event logging, performance metrics preparation, assisting in content creation.
* **Primary Users (Content Consumers):**
    * **Athletes/Players:** Reviewing personal performance, team tactics, coach feedback, and personal highlight reels, primarily on mobile devices.
* **Secondary Users:**
    * **Team Managers:** Organizing video content, managing team rosters and access, potentially managing club promotional content.
    * **Sports Directors/Organizational Admins:** Overseeing multiple teams, managing subscriptions, approving externally shared content.
    * **Parents (Youth Sports):** Viewing shared highlights, "Coaching Events," or feedback relevant to their child.
    * **Scouts:** Reviewing shared footage or compilations of specific players.
    * **Club Marketing/Social Media Managers:** Utilizing compiled video content for club promotion.
    * **Educators/Tutors (Future Vertical):** Using the same event-based analysis for educational content or skill tutoring.

## 4. Problem Statement

Current video analysis workflows for many sports teams (and potentially other analytical domains) can be:

* **Fragmented:** Requiring multiple tools or steps to combine different types of analysis for a single moment of interest.
* **Inefficient:** Creating and linking separate annotations for a single moment is time-consuming.
* **Lacking Holistic Context:** Sharing isolated annotations may not convey the full insight.
* **Overlay/Control Conflicts:** Native video player controls and fullscreen modes often conflict with interactive overlays like drawing canvases.
* **Limited Content Repurposing:** Analyzed segments are not easily repurposed into shareable highlights or presentations.

This platform solves these by:
* Unifying tools within a single "Coaching Event" framework.
* Providing externalized video controls for a consistent experience.
* Implementing a controlled "enlarged player mode" instead of disruptive true browser fullscreen.
* Integrating content creation tools directly with the analysis workflow.

## 5. Proposed Solution: The "Coaching Event" Platform

The platform will be a web application (Progressive Web App - PWA for mobile accessibility) where the central unit of analysis is a **"Coaching Event."**

A **Coaching Event** is:
* Anchored to a specific `timestamp_start` on a video.
* Has a user-definable `timestamp_end` determining its visibility duration during playback.
* Can be given a `name` or `title` by the user.
* Can integrally contain any combination of the following analytical components:
    * **Textual Notes:** For descriptions, instructions, or feedback.
    * **Loop Definition:** Parameters to loop the video segment relevant to this event.
    * **Tags:** Application of multiple predefined or custom tags.
    * **Canvas Drawings (Telestration):** Graphical overlays (pencil, lines, arrows, shapes, text) specific to this event, designed to work reliably within the application's controlled normal and enlarged player views.
    * **User Mentions:** Ability to "tag" specific users.
* Video playback will be managed via a set of **external controls** (play/pause, seek, speed, etc.) separate from the video frame itself.
* An **"Enlarge Player / Shrink Player"** button will toggle the video analysis area between a normal size and a larger, optimized size within the application window, maintaining access to necessary controls and sidebars.

## 6. Core Features & Functionality (MVP Focus Highlighted)

### 6.1. Video Management
* **MVP: Video Linking:** Allow users to link videos from YouTube and Vimeo by URL. Fetch basic metadata (title, duration) if possible.
* **Video Library:** Centralized access to linked (and future uploaded) videos, associated with teams. Basic search/filter.
* **Video Details:** Store and display title, `video_url`, `source` ('youtube', 'vimeo', 'upload'), duration, associated team, uploader.
* **(Post-MVP):** Direct Video Upload, advanced organization (folders, seasons).

### 6.2. "Coaching Event" Creation & Management
* **MVP: Initiate Event:** Button to "Create Analysis Point" at the current video timestamp.
* **MVP: Analysis Event Editor (Modal/Panel):**
    * Input for Event `name/title`.
    * Set `timestamp_start` (current video time).
    * Set `timestamp_end` for visibility (default 10s, user adjustable).
    * **Integrated Notes Section (MVP):** Plain text area for event-specific notes.
    * **Integrated Loop Section (MVP):** Controls to define loop start/end, name.
    * **Integrated Tagging Section (MVP):** Interface to select and apply multiple tags from a pre-defined library for the team's sport.
    * **Integrated Drawing Section (MVP - Pencil Tool First):**
        * Activates a canvas overlay.
        * Initial tool: Pencil. Controls for color and stroke width.
        * Drawings are saved as operations linked to this event, with `original_canvas_width/height` for scaling. Robust scaling in normal and "enlarged" player modes is critical.
    * **Integrated User Mentions Section (MVP):** Select users from the team to "tag" for this event.
    * **MVP: Save Event:** Persists the `annotations` record and its linked component data.
* **MVP: Display of Events:**
    * Listed in an "Analysis Events" tab for the video.
    * Visual markers on the video timeline (simple).
    * Activating an event seeks video, displays its components for its defined duration.
* **MVP: "Clear Displayed Event Components" Button.**
* **(MVP/Post-MVP):** Edit/Delete Events.

### 6.3. Externalized Video Controls & Enlarged Player Mode
* **MVP: External Controls:** Implement play/pause, custom seek bar, volume control, speed control (0.5x-2x), loop activation button, and an "Enlarge/Shrink Player" button. These controls interface with the video player (YouTube API, etc.).
* **MVP: Enlarged Player Mode:** The "Enlarge/Shrink Player" button toggles the video analysis area (video + relevant sidebars for annotations/events) between a standard view and a larger, optimized view within the application window.

### 6.4. Team & User Management
* **MVP: Basic Team Structure:** Users belong to teams. Each team has a `sport` attribute.
* **MVP: User Roles (Simplified):** Coach (can create/edit events), Player (can view events they are mentioned in or shared with).
* **(Post-MVP):** Full Organization hierarchy, more roles, invitations.

### 6.5. Sharing & Collaboration
* **MVP: Share "Coaching Event" with Team Members:** Allow a coach to make a "Coaching Event" visible to all members of the video's team, or specific members via mentions.
* **(Post-MVP):** Sharable links, granular permissions, sharing full videos/compilations.

### 6.6. Athlete Experience (Mobile-Optimized)
* **MVP: View Shared/Mentioned Events:** Athletes can log in (on mobile browser) and view a list of "Coaching Events" where they were mentioned or that were shared with their team. Playback shows all components (notes, scaled drawings, loop plays, tags highlighted).

### 6.7. Content Creation & Export
* **(Post-MVP):** Clip compilation, highlight reels, MP4 export, branding. (The `timestamp_start` and `timestamp_end` of Coaching Events form the basis for these future features).

## 7. User Interface & User Experience (High-Level Principles)

* **Event-Centric Workflow:** The UI guides users through creating and reviewing holistic "Coaching Events."
* **Clarity and Control:** Externalized video controls and the "enlarged player mode" provide a consistent and controlled viewing/analysis environment.
* **Intuitive Annotation:** Integrated tools within the "Analysis Event Editor" should be easy to use.
* **Performance:** Highly performant interface, especially the video player, drawing canvas, and event rendering.
* **Accessibility:** Adhere to WCAG 2.1 AA.

## 8. Technical Considerations (High-Level for PRD)

* **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, Zustand.
* **Backend/Database:** Supabase (PostgreSQL, Auth, Storage).
* **Drawing:** Native HTML5 Canvas (initially for simplicity and control over scaling within the "enlarged mode") or a carefully integrated Fabric.js if native proves too limited for desired tools. Focus on robust scaling.
* **Video Player API:** Interact with YouTube/Vimeo APIs via their SDKs/iframe APIs to control playback through external UI.

## 9. Success Metrics (MVP)

* Number of active coaches creating "Coaching Events."
* Average number of components (notes, loops, tags, drawings, mentions) per "Coaching Event."
* Frequency of "Enlarged Player Mode" usage.
* Athlete engagement: Number of views on events they are mentioned in.
* User feedback on ease of use of the "Analysis Event Editor."

## 10. Future Considerations / Roadmap

* Direct video upload and processing.
* Advanced drawing tools (shapes, text, animations).
* Full content creation suite (highlight reels, MP4 export).
* AI-powered analysis (auto-tagging, play recognition).
* Advanced analytics dashboards.
* Real-time collaborative analysis sessions.
* Native mobile applications.

## 11. Open Questions for MVP

* Specific list of default sports for team creation?
* Default visibility duration for a "Coaching Event" if `timestamp_end` is not explicitly set?
* Minimum set of drawing tools (beyond pencil) for drawing MVP within an event?

---