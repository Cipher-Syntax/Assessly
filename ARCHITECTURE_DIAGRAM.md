# Assessly Architecture Diagram

This file contains the Mermaid architecture diagram representing the Assessly project based on the documentation provided in `context/`.

```mermaid
graph TD
    %% Actors
    Creator(["Creator / Owner / Editor"])
    Responder(["Responder / Student"])

    %% Frontend Layer
    subgraph Frontend ["Frontend (React + TailwindCSS)"]
        direction TB
        UI_Dashboard[Dashboard UI]
        UI_FormBuilder[Form Builder UI]
        UI_FormRenderer[Dynamic Form Renderer]
        
        State_Auth[Auth / Session State]
        Service_API[Centralized API Service Layer]
        
        Creator --> UI_Dashboard
        Creator --> UI_FormBuilder
        Responder --> UI_FormRenderer
        
        UI_Dashboard --> State_Auth
        UI_FormBuilder --> State_Auth
        UI_FormRenderer --> State_Auth
        
        UI_Dashboard --> Service_API
        UI_FormBuilder --> Service_API
        UI_FormRenderer --> Service_API
    end

    %% Backend Layer
    subgraph Backend ["Backend (Django + DRF)"]
        direction TB
        Gateway_DRF["DRF API Router / Views"]
        
        subgraph Django_Apps ["Django Domain Apps"]
            App_Accounts["accounts <br/> Auth, OAuth, Users"]
            App_Permissions["permissions <br/> RBAC, Access Tokens"]
            App_Forms["forms <br/> Schema, Versioning, Publish"]
            App_Responses["responses <br/> Drafts, Submissions, Anti-Cheat"]
            App_Services["services <br/> Cross-app Business Logic"]
        end
        
        Service_API -- HTTP / JWT --> Gateway_DRF
        
        Gateway_DRF --> App_Accounts
        Gateway_DRF --> App_Permissions
        Gateway_DRF --> App_Forms
        Gateway_DRF --> App_Responses
        
        App_Accounts --> App_Services
        App_Permissions --> App_Services
        App_Forms --> App_Services
        App_Responses --> App_Services
    end

    %% Storage Layer
    subgraph Storage ["Storage Layer"]
        direction TB
        DB[("PostgreSQL")]
        
        DB_Users["Users"]
        DB_Forms["Forms & Versions <br/> JSONB Schema"]
        DB_Responses["Responses & Sessions <br/> JSONB Data"]
        DB_ACL["Permissions & Tokens"]
        
        App_Accounts --> DB_Users
        App_Forms --> DB_Forms
        App_Responses --> DB_Responses
        App_Permissions --> DB_ACL
        
        DB_Users -.-> DB
        DB_Forms -.-> DB
        DB_Responses -.-> DB
        DB_ACL -.-> DB
    end
```

## Description of Architecture Layers

1. **Frontend (React + TailwindCSS)**:
   - Handles the UI for Creators (Dashboard, Form Builder) and Responders (Form Renderer).
   - Follows a schema-driven approach where the UI structure is driven by the backend schema.
   - All external data fetching is centralized in the API Service Layer.

2. **Backend (Django + Django REST Framework)**:
   - Contains domain-isolated apps: `accounts`, `forms`, `responses`, and `permissions`.
   - The `services/` directory is used for shared business logic across multiple domains.
   - The backend is the strict single source of truth for all validation, form structure, permissions, and anti-cheat evaluations.

3. **Storage (PostgreSQL)**:
   - Persists all the structured data and entities.
   - Uses `JSONB` to store flexible form schemas and responses.
   - `Forms` use a public UUID identifier for the frontend/API, while maintaining numeric primary keys for internal relationships.
