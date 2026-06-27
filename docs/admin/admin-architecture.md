# Admin Architecture

## Overview

Package 2 adds a real production CMS admin panel on top of the existing Package 1 stack:

Frontend (`/admin/*`)
-> protected server-rendered admin routes
-> server actions
-> Prisma
-> PostgreSQL

Public catalog routes remain unchanged and continue using the existing repository layer.

## Routes

- `/admin/login`
- `/admin`
- `/admin/dashboard`
- `/admin/products`
- `/admin/products/new`
- `/admin/products/[id]`
- `/admin/services`
- `/admin/services/new`
- `/admin/services/[id]`
- `/admin/media`
- `/admin/media/[id]`
- `/admin/reviews`
- `/admin/reviews/new`
- `/admin/reviews/[id]`
- `/admin/settings`
- `/admin/users`
- `/admin/users/new`
- `/admin/users/[id]`

## Authentication

- Passwords are hashed with Node `scrypt` in [lib/auth/password.ts](/Users/Radamir/Documents/Vedma/lib/auth/password.ts).
- Auth sessions are stored in Prisma `Session` records and identified with an HTTP-only cookie.
- Protected routes use [lib/auth/session.ts](/Users/Radamir/Documents/Vedma/lib/auth/session.ts).
- Login creates a DB-backed session and updates `User.lastLoginAt`.
- Logout clears the cookie and deletes the current session row.

## Roles And Permissions

### ADMIN

- Full access to all admin routes
- Can manage users
- Can manage settings
- Can reset passwords
- Can deactivate users

### MANAGER

- Can access dashboard
- Can manage products
- Can manage services
- Can manage media
- Can manage reviews
- Cannot access users
- Cannot access settings

## CRUD Surface

### Products

- Search
- Status filter
- Sorting
- Pagination
- Bulk publish/hide/draft
- Create
- Edit
- Delete with confirmation
- Preview link
- SEO fields
- Slug editing
- Category and pricing controls
- Media selection via existing library paths

### Services

- Same CRUD quality as products
- Service-specific fields for format, duration, execution time

### Media

- Existing imported media displayed from `Media`
- Search
- Upload
- Alt text editing
- Source URL editing
- File replacement in-place to preserve links
- Delete with reference protection

### Reviews

- Create
- Edit
- Delete
- Publication status

### Settings

- Stored in `SiteSetting` key `site_settings`
- Contacts
- SEO
- Homepage hero texts
- Footer copy
- Social links
- Legal text blocks
- Currency metadata

### Users

- Admin only
- List
- Create admin/manager
- Edit
- Deactivate
- Reset password

## Public Site Integration

- Product/service CRUD writes directly to Prisma tables already used by the repository layer.
- Product/service save/delete actions call `revalidatePath()` for `/`, `/products`, `/products/[slug]`, `/services`, `/services/[slug]`, and matching admin pages.
- Reviews now read from DB when available, with fallback to existing mock data.
- Settings now affect:
  - root metadata
  - homepage hero copy
  - footer copy
  - contacts page
  - legal page

## Database Flow

Admin form
-> server action in [app/admin/actions.ts](/Users/Radamir/Documents/Vedma/app/admin/actions.ts)
-> validation/helpers
-> Prisma write
-> path revalidation
-> public route reflects updated state

## Media Flow

Upload/replace uses filesystem writes under `public/uploads/admin/*`, then updates the `Media` table.

Existing VK paths remain preserved. Replacements overwrite the same file path so public URLs do not change.

## Schema Additions

Package 2 adds:

- `User.isActive`
- `User.lastLoginAt`
- `Session` model

Migration:

- [prisma/migrations/20260627120000_package_2_admin_auth/migration.sql](/Users/Radamir/Documents/Vedma/prisma/migrations/20260627120000_package_2_admin_auth/migration.sql)
