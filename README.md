TRIZEN Photography

Project Links

GitHub Repository:
https://github.com/Sakthi0208-code/Trizon-Photography

Live Deployed Application:
https://trizon-photography.vercel.app

TRIZEN Photography is an event photography management and customer gallery platform designed to manage the workflow from event creation and photographer uploads to customer-ready photo galleries.

The platform separates access into three roles:

Admin – manages events, team members, photo selection, and customer galleries.

Team Member – works only on assigned events and uploads photos.

Customer – accesses a published gallery using a public URL and PIN without creating an account.

Demo Login Credentials

These accounts are provided for evaluation of the deployed application.

Admin Account

Login URL:
https://trizon-photography.vercel.app/login

Email:
Admin@gmail.com

Password:
Admin123

Role:
ADMIN

The Admin account is used to access the complete management dashboard, including events, team members, photos, and galleries.

Team Member Accounts

All five demo Team Member accounts are available for direct evaluation.

Email

Password

Role

teammember1@gmail.com

TeamMember123

TEAM_MEMBER

teammember2@gmail.com

TeamMember123

TEAM_MEMBER

teammember3@gmail.com

TeamMember123

TEAM_MEMBER

teammember4@gmail.com

TeamMember123

TEAM_MEMBER

teammember5@gmail.com

TeamMember123

TEAM_MEMBER

Team Member Login URL:
https://trizon-photography.vercel.app/login

Why demo Team Member accounts are pre-created

The application includes an Admin-driven invitation workflow for creating Team Members. For assessment purposes, five pre-created Team Member accounts are also provided so that the evaluator can immediately test role-based access, event assignment, photo uploads, and Team Member restrictions without depending on invitation email delivery.

The invitation functionality is still implemented in the application and can be tested separately.

Security note: These are assessment/demo credentials. For a real production deployment, passwords should not be published in a public README and should be rotated after evaluation.

1. Project Overview

TRIZEN is designed for photography teams that need a controlled workflow for managing event photos and delivering a curated set of images to customers.

The system provides:

Event creation and management.

Team Member assignment.

Photo upload and metadata storage.

Admin photo review and selection.

Customer gallery creation.

Gallery publishing and unpublishing.

PIN-protected customer access.

Secure image delivery using signed URLs.

The application does not require customers to create an account.

2. Core User Roles

Admin

The Admin is the main application manager.

Admin capabilities include:

Sign in securely.

Create photography events.

Add and assign Team Members.

View event photos.

Review and select photos.

Create multiple customer galleries for an event.

Edit customer gallery information.

Change selected photos in a gallery.

Publish galleries.

Unpublish galleries.

Delete galleries.

View customer gallery URLs.

View customer gallery PINs.

Manage Team Members.

The Admin dashboard is available at:

https://trizon-photography.vercel.app/admin

Team Member

Team Members are authenticated users who work on assigned events.

Team Member capabilities include:

Sign in securely.

View assigned events.

Open an assigned event.

Upload multiple photos.

Upload JPEG, PNG, and WebP images.

Upload photos subject to server-side file-size validation.

Team Members cannot:

Access unassigned events.

Publish customer galleries.

Unpublish galleries.

Delete galleries.

Manage other Team Members.

Customer

Customers do not create an account.

Customer access works through:

A unique gallery URL.

A gallery PIN.

After successful PIN verification, the customer can:

View selected photos.

Open photos in fullscreen mode.

Navigate between photos.

Download photos.

Customers can only access galleries that have been published.

3. Application Workflow

The main workflow is:

Admin
  |
  v
Create Event
  |
  v
Assign Team Members
  |
  v
Team Member Uploads Photos
  |
  v
Admin Reviews Photos
  |
  v
Admin Selects Customer Photos
  |
  v
Create Gallery
  |
  v
Publish Gallery
  |
  v
Customer Opens URL + Enters PIN
  |
  v
Customer Views Selected Photos

4. Technology Stack

Frontend

Next.js 16

React

TypeScript

Tailwind CSS

Backend

Next.js App Router

Next.js Route Handlers

Database and Backend Services

Supabase

PostgreSQL

Supabase Auth

Supabase Storage

Testing

Playwright

Chromium

Deployment

Vercel

5. Architecture

The application uses Next.js as the main web application layer and Supabase as the backend platform.

The main flow is:

Browser
   |
   v
Next.js
   |
   +---- Supabase Auth
   |
   +---- PostgreSQL
   |
   +---- Supabase Storage

The application contains separate interfaces for Admins, Team Members, and Customers.

Customers access a public gallery endpoint but do not receive direct unrestricted access to the database.

6. Project Structure

photo-sharing-platform/
|
├── app/
│   ├── admin/
│   │   ├── events/
│   │   ├── galleries/
│   │   ├── team-members/
│   │   └── page.tsx
│   │
│   ├── api/
│   │   ├── admin/
│   │   │   └── gallery/
│   │   │       ├── create/
│   │   │       ├── delete/
│   │   │       └── status/
│   │   ├── events/
│   │   │   └── create/
│   │   ├── gallery/
│   │   │   └── verify/
│   │   └── team-member/
│   │       └── upload/
│   │
│   ├── auth/
│   │   ├── accept-invite/
│   │   └── signout/
│   │
│   ├── gallery/
│   │   └── [galleryId]/
│   │
│   ├── login/
│   │
│   └── team-member/
│       └── events/
│
├── components/
│   ├── admin-sidebar.tsx
│   ├── sign-out-button.tsx
│   └── ui/
│
├── lib/
│   └── supabase/
│       ├── admin.ts
│       ├── client.ts
│       ├── proxy.ts
│       └── server.ts
│
├── public/
│   └── images/
│
├── supabase/
│   └── schema.sql
│
├── tests/
│   └── smoke.spec.ts
│
├── .env.example
├── .gitignore
├── package.json
├── playwright.config.ts
├── proxy.ts
└── README.md

7. Database Design

The application uses six core application tables.

profiles

Stores authenticated user information and application role.

Fields:

id

full_name

role

created_at

Allowed roles:

ADMIN

TEAM_MEMBER

The id references the Supabase Auth user.

events

Stores photography event information.

Fields:

id

name

description

event_date

location

status

created_by

created_at

Event status values:

DRAFT

ACTIVE

COMPLETED

event_members

Creates the relationship between events and Team Members.

Fields:

event_id

user_id

assigned_at

The primary key is:

(event_id, user_id)

This prevents the same Team Member from being assigned to the same event more than once.

photos

Stores photo metadata.

Fields:

id

event_id

uploaded_by

storage_path

file_name

file_size

created_at

The actual image binary is stored in Supabase Storage rather than PostgreSQL.

galleries

Stores customer gallery information.

Fields:

id

event_id

customer_name

public_token

pin

pin_hash

published

created_at

public_token is used to identify the public gallery URL.

The PIN is retained for Admin visibility, while the hashed PIN is used for verification.

gallery_photos

Stores which photos were selected for a customer gallery.

Fields:

gallery_id

photo_id

added_at

This design allows one event to have multiple galleries with different customer photo selections.

8. Database Relationships

profiles
   |
   +---- events
   |
   +---- event_members
             |
             v
           events

events
   |
   +---- photos
   |
   +---- galleries
              |
              v
        gallery_photos
              |
              v
            photos

Important relationships:

One Admin/Profile can create multiple events.

One event can have multiple Team Members.

One event can have multiple photos.

One event can have multiple galleries.

One gallery can contain multiple selected photos.

One photo can be selected into multiple galleries.

9. Authentication

Supabase Auth is used for Admin and Team Member authentication.

Admin Authentication

The Admin logs in through:

https://trizon-photography.vercel.app/login

After successful authentication and role verification, the Admin is redirected to:

/admin

Team Member Authentication

Team Members use the same login page.

In the normal workflow, Team Members can be invited by an Admin.

The project also contains five pre-created demo accounts for evaluation.

Customer Authentication

Customers do not have Supabase Auth accounts.

They authenticate to an individual gallery using a public URL plus a PIN.

10. Authorization

TRIZEN uses role-based authorization.

Admin permissions

Admin users can manage:

Events

Team Members

Photos

Galleries

Team Member permissions

Team Members can:

Read their assigned events.

Upload photos to assigned events.

Access to unassigned events is blocked.

Customer permissions

Customers can only access:

Published galleries.

Photos explicitly selected for that gallery.

Customers do not receive direct authenticated access to the application's database tables.

11. Row Level Security

Row Level Security is enabled for the core application tables.

The policies are designed to restrict access based on:

auth.uid()

User role

Event assignment

Ownership

Examples:

Admins can manage application data.

Team Members can access assigned events.

Team Members can insert photos only for assigned events and only as themselves.

Customers do not receive direct SELECT access to gallery records.

The customer verification flow is handled server-side.

12. Photo Storage

The project uses a private Supabase Storage bucket:

event-photos

The database stores only metadata and the storage path.

Example metadata:

file_name
file_size
storage_path
event_id
uploaded_by
created_at

The actual image is stored in Supabase Storage.

For protected customer access, the server generates temporary signed URLs rather than exposing the storage bucket publicly.

13. Photo Upload Validation

Uploads are validated on the server.

Current limits:

Maximum 50 files per upload request.

Maximum 20 MB per file.

Supported formats:

JPEG

PNG

WebP

The upload endpoint also verifies that the authenticated Team Member is assigned to the target event.

If an upload sequence fails, the application includes rollback logic for uploaded storage objects and photo records.

14. Gallery Lifecycle

A gallery starts in Draft state.

Create
  ↓
Draft
  ↓
Edit / Select Photos
  ↓
Publish
  ↓
Customer Access

A published gallery can be unpublished:

Published
  ↓
Unpublish
  ↓
Draft

A gallery cannot be published without at least one selected photo.

Deleting a gallery removes the gallery relationship records and gallery record. The underlying event photos remain available to the event because deleting a gallery does not delete the source photos.

15. Gallery Security

Each gallery receives a random public token.

Customer URL format:

https://trizon-photography.vercel.app/gallery/<public-token>

The public token identifies the gallery but does not by itself expose the photos.

The customer must also provide the correct PIN.

PIN verification is performed server-side.

The stored PIN hash uses PBKDF2 hashing.

Only published galleries are accepted by the public verification endpoint.

16. API Endpoints

Admin

Create Event

POST /api/events/create

Create or Edit Gallery

POST /api/admin/gallery/create

Publish or Unpublish Gallery

POST /api/admin/gallery/status

Delete Gallery

POST /api/admin/gallery/delete

Team Member

Upload Photos

POST /api/team-member/upload

Customer

Verify Gallery PIN

POST /api/gallery/verify

17. Supabase Authentication Redirect Configuration

Production authentication uses:

https://trizon-photography.vercel.app

Production invitation redirect:

https://trizon-photography.vercel.app/auth/accept-invite

Local development invitation redirect:

http://localhost:3000/auth/accept-invite

This prevents Team Member invitation links from relying on protected temporary Vercel deployment hostnames.

18. Environment Variables

Create a .env.local file for local development.

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SECRET_KEY=your_supabase_secret_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

For production, the same variables are configured in Vercel.

Production NEXT_PUBLIC_SITE_URL:

https://trizon-photography.vercel.app

Important:

.env.local must never be committed.

SUPABASE_SECRET_KEY must remain server-side.

.env.example contains placeholders only.

19. Local Development Setup

1. Clone the repository

git clone https://github.com/Sakthi0208-code/Trizon-Photography.git
cd Trizon-Photography

2. Install dependencies

npm install

3. Create environment file

Create:

.env.local

Add the required Supabase values.

4. Configure Supabase

Create a Supabase project.

Open the Supabase SQL Editor and run:

supabase/schema.sql

Then configure:

Authentication

Email provider

Storage

Auth redirect URLs

5. Run locally

npm run dev

Open:

http://localhost:3000

20. Testing

The project uses Playwright with Chromium.

Run:

npm test

The current smoke tests verify:

Login page loads.

Admin route protection works.

Team Member route protection works.

Admin Events route exists.

Customer Gallery route exists.

Open the HTML report with:

npm run test:report

21. Production Build

Run:

npm run build

The production build should complete successfully without TypeScript errors.

22. Deployment

The application is deployed through Vercel.

Production URL:

https://trizon-photography.vercel.app

The repository's master branch is connected to the production deployment.

Production environment variables are configured in Vercel.

The production domain is publicly accessible, while application-level authentication protects Admin and Team Member areas.

23. Security Test Scenarios

The application should be tested against the following cases.

Unauthorized Event Access

A Team Member should not be able to access an event that is not assigned to them.

Gallery Publishing Authorization

A Team Member should not be able to publish or unpublish a customer gallery.

Upload Validation

Unsupported file types and files above the allowed size limit should be rejected.

Incorrect Gallery PIN

An incorrect PIN must not return customer gallery photos.

Unpublished Gallery

An unpublished gallery must not expose selected photos through the public verification endpoint.

Customer Database Access

Customers should not receive direct database access to private gallery records.

24. Assessment Evaluation Flow

A recommended evaluation sequence is:

Open the live application.

Sign in with the Demo Admin account.

Create an event.

View the Team Members section.

Test one of the pre-created Team Member accounts.

Verify Team Member access is restricted to assigned events.

Upload photos as a Team Member.

Return to Admin.

Review and select uploaded photos.

Create a customer gallery.

Publish the gallery.

Open the public gallery URL.

Enter the generated PIN.

Verify only selected photos are visible.

Test unpublish and confirm public access is blocked.

25. Why Pre-created Demo Accounts Are Used

The application supports the required Admin-driven Team Member invitation workflow.

Five additional Team Member accounts are pre-created specifically for assessment evaluation.

This is done to make the deployed application immediately testable without requiring the evaluator to depend on external email delivery, mailbox availability, or access to temporary deployment URLs.

The accounts also make it possible to test multiple Team Member identities and role-based access independently.

This does not remove or replace the invitation functionality implemented in the application.

26. Demo Account Summary

ADMIN
Email: Admin@gmail.com
Password: Admin123

TEAM MEMBER 1
Email: teammember1@gmail.com
Password: TeamMember123

TEAM MEMBER 2
Email: teammember2@gmail.com
Password: TeamMember123

TEAM MEMBER 3
Email: teammember3@gmail.com
Password: TeamMember123

TEAM MEMBER 4
Email: teammember4@gmail.com
Password: TeamMember123

TEAM MEMBER 5
Email: teammember5@gmail.com
Password: TeamMember123

All demo Team Member accounts use the TEAM_MEMBER application role.

27. Final Validation

Before submission, run:

npm run build
npm test

Expected:

Production build: PASS
Playwright tests: PASS

Also verify:

.env.local is not in Git.

Supabase secret keys are not in Git.

node_modules/ is ignored.

.next/ is ignored.

Playwright reports are ignored.

supabase/schema.sql is included.

.env.example is included.

The live application is reachable.

28. Repository

https://github.com/Sakthi0208-code/Trizon-Photography

29. Live Application

https://trizon-photography.vercel.app

License

This project was developed as a technical assessment project.