# Almadena Parity Checklist

This checklist tracks parity between local implementation and production reference:
[almadena.vercel.app](https://almadena.vercel.app/).

## Public Pages

- [ ] Home page hero, trust stats, CTA blocks
- [ ] Services grid cards, labels, and iconography
- [ ] Pricing page package cards and ordering
- [ ] Questions and exams browsing pages
- [ ] Mock exam selector and exam flow
- [ ] Instructors page layout and content hierarchy
- [ ] License requirements page sections and copy
- [ ] Contact page details, form fields, and UX states
- [ ] Student lookup and student results experiences

## Authentication

- [ ] Login form (UI, validation, errors, loading states)
- [ ] Signup form full field coverage and behavior
- [ ] Forgot password flow and feedback states
- [ ] Session persistence and logout behavior

## Admin

- [ ] Admin dashboard overview cards and quick links
- [ ] Students management CRUD states
- [ ] Questions management CRUD states
- [ ] Pricing management CRUD states
- [ ] Study materials management CRUD states
- [ ] Success stories management CRUD states
- [ ] Site settings management CRUD states

## Shared UX

- [ ] Header navigation behavior (mobile + desktop)
- [ ] Admin-managed navbar menu items (title/link/order/visibility)
- [ ] Admin-managed inquiry dropdown items (title/link/description/order/visibility)
- [ ] Admin-managed bell badge (enable/count/color/target)
- [ ] Footer layout and links
- [ ] Arabic RTL alignment and typography consistency
- [ ] Toast/alert language and behavior consistency
- [ ] Loading/empty/error states consistency

## Backend Behavior

- [ ] Auth endpoints parity (`register`, `login`, `session`)
- [ ] Role checks for admin paths
- [ ] Data validation and API error format consistency
- [ ] DB schema behavior parity across all entities
