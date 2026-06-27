# Admin User Guide

## Login

1. Open `/admin/login`
2. Enter admin or manager credentials
3. After login you will be redirected to `/admin/dashboard`

## Dashboard

The dashboard shows:

- product count
- service count
- media count
- order count
- request count
- payment count
- recent catalog updates

Use the quick actions to jump into creating products, services, or working with media.

## Products

- Open `/admin/products`
- Use search, status filter, and sorting at the top
- Select multiple rows to bulk publish, hide, or move to draft
- Use `Новый товар` to create a new card
- Use `Редактировать` to update an existing card
- Use `Preview` to open the public page

## Services

The workflow matches products:

- listing
- search
- filter
- create
- edit
- preview
- bulk publish/hide/draft

## Media

- Open `/admin/media`
- Upload new JPG, PNG, or WEBP files
- Edit alt text and source URL
- Replace an existing file while preserving its public path
- Delete only after unlinking from products/services

## Reviews

- Open `/admin/reviews`
- Create or edit reviews
- Control publication status
- Published reviews appear on the public reviews page and home reviews block when DB is available

## Settings

Admin only.

Use `/admin/settings` to manage:

- contacts
- SEO metadata
- homepage hero copy
- footer text
- social links
- legal blocks
- currency metadata

After saving, affected public pages are revalidated automatically.

## Users

Admin only.

Use `/admin/users` to:

- create managers
- create admins
- edit existing admins/managers
- deactivate accounts
- reset passwords

## Notes

- Product and service pages warn about unsaved changes before leaving.
- Success and error messages appear at the top of admin pages after actions complete.
- Package 2 does not include commerce, checkout, payments, Telegram notifications, or customer auth.
