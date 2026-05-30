<div align="center">
  <img src="./frontend/src/assets/images/hero-banner.svg" alt="Structured Forms, Secure Responses" width="100%" />
</div>

# Assessly

## Overview

Assessly is a multi-section, schema-driven form builder and response system inspired by Google Forms, designed for structured data collection such as quizzes, exams, and surveys. It allows creators (teachers, admins, or organizations) to build dynamic forms with sections and multiple question types, configure access permissions, and collect responses with draft-saving and submission tracking. The system includes role-based access control, versioned publishing, and lightweight behavioral tracking (such as tab-switch detection) to monitor respondent activity during form completion.

---

## Goals

1. Provide a flexible form builder supporting multiple question types and multi-section forms.
2. Enable creators to control access through roles (owner, editor, responder) and shareable links.
3. Support draft saving and cross-device resumption for authenticated users.
4. Allow multiple submissions per responder with configurable restrictions.
5. Introduce basic anti-cheating signals such as tab-switch tracking and focus loss detection.
6. Ensure forms are versioned and immutable after publishing to preserve response integrity.
7. Provide a clean, linear, distraction-free respondent experience.

---

## Core User Flow

### Creator Flow
1. User registers or logs in (Google OAuth or email/password).
2. User lands on dashboard showing all created forms.
3. User creates a new form from a blank template.
4. User builds the form using:
   - Sections (optional multi-page structure)
   - Questions (short text, paragraph, multiple choice, checkboxes, dropdown)
5. User configures form settings:
   - Access permissions (restricted or link-based)
   - Role assignments (editor/responder)
   - Anti-cheat toggle settings
6. User publishes the form, creating an immutable version snapshot.
7. User shares the form via link or invited access.
8. User views responses in a dashboard (manual refresh).
9. User reviews individual submissions or summary data.

---

### Responder Flow
1. User opens a form link or logs in.
2. System checks access permissions.
3. User either:
   - Resumes existing draft, or
   - Starts a new attempt (if allowed)
4. User completes form in a linear, section-based flow.
5. System auto-saves progress as a draft (for authenticated users).
6. System tracks behavior events (tab switching, focus loss).
7. User submits final response.
8. Response is stored with metadata (timestamps, session data, anti-cheat signals).
9. Submission becomes viewable to form owner/editor.

---

## Features

### 1. Form Builder
- Multi-section form creation
- Dynamic question types:
  - Short text
  - Paragraph
  - Multiple choice
  - Checkboxes
  - Dropdown
- Question configuration:
  - Required toggle
  - Option duplication and deletion
- Drag-and-structured layout (logical ordering of questions and sections)

---

### 2. Response System
- One draft per user per form
- Resume capability across devices (for authenticated users)
- Multiple submissions per form (configurable)
- Auto-save draft functionality
- Submission persistence with structured JSON answers

---

### 3. Access Control System
- Role-based permissions:
  - Owner
  - Editor
  - Responder
- Link-based access (secure token system)
- Restricted or public access modes
- Separate editor and responder permission controls

---

### 4. Publishing & Versioning
- Draft forms editable until published
- Publishing creates immutable form version snapshot
- Prevents changes from affecting existing responses
- Supports future form evolution without data corruption

---

### 5. Anti-Cheat Monitoring
- Tab-switch detection
- Window focus loss tracking
- Event logging per session
- Configurable thresholds:
  - Warning on first violations
  - Auto-submit on repeated violations
- Per-session behavioral analytics stored for review

---

### 6. Dashboard & Analytics
- List of created forms
- Response counts per form
- Individual response review
- Summary view per question
- Manual refresh-based updates (no real-time sync in MVP)

---

## In Scope

- User authentication (Google OAuth + email/password)
- Form creation and editing system
- Multi-section form structure
- Dynamic question rendering system
- Draft saving and resume functionality
- Role-based access control (owner, editor, responder)
- Secure link sharing system
- Form publishing with version snapshots
- Response submission system
- JSON-based response storage
- Basic anti-cheat tracking (tab switching, focus events)
- Manual dashboard updates for responses

---

## Out of Scope

- Real-time collaboration editing (Google Docs-style)
- WebSocket-based live dashboards
- AI-based grading or response evaluation
- Advanced analytics dashboards or data visualization
- Mobile native applications (iOS/Android)
- Offline-first full synchronization system
- Payment systems or monetization features
- Camera-based proctoring or facial recognition
- Real-time cheating detection enforcement systems
- Email notification system for responses (MVP phase)

---

## Success Criteria

The project is considered successful when:

1. A user can register, create a form, and publish it without errors.
2. A form can support multiple sections and question types dynamically.
3. Responders can access forms via link or login and submit responses successfully.
4. Drafts are automatically saved and can be resumed across sessions (for authenticated users).
5. Form versions are immutable after publishing and do not affect existing responses.
6. Role-based access correctly restricts or allows actions (edit, view, respond).
7. Basic anti-cheat events (tab switching, focus loss) are reliably logged per session.
8. The system remains stable under multiple concurrent form submissions.
9. Creators can view and review submitted responses in a structured format.

---

## Tech Stack

- **Frontend Web**: React + TailwindCSS + plain CSS
- **Backend**: Django (DRF, ORM, Celery, migrations)
- **Database**: PostgreSQL

---

## Development Setup

### Backend (Django)

### Backend Setup (Django)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
    ```bash
    python -m venv venv
    source venv/Scripts/activate
    ```
3. Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4. Set up the PostgreSQL database and run migrations:
    ```bash
    python manage.py migrate
    ```
5. Start the development server:
    ```bash
    python manage.py runserver
    ```

### Frontend (React)

1. Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2. Install dependencies:
    ```bash
    npm install
    ```
3. Start the development server:
    ```bash
    npm run dev
    ```

### LICENSE
MIT