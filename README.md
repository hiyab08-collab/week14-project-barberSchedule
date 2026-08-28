# NTen Cuts — Barbershop Booking Platform

## Problem Statement
Small barbershops often rely on phone calls or walk-ins to manage appointments, which leads to double-bookings, missed calls, and no easy way for customers to see what services are offered or leave feedback. NTen Cuts solves this by giving a barbershop a real online booking system: customers can browse services, pick a barber, book a time slot, and the system automatically prevents double-booking. Shop owners get a full admin dashboard to manage services, staff, and appointments without touching the database directly.

## Target User
- **Customers** who want to browse services, book an appointment with a specific barber, view their upcoming appointments, and leave reviews/likes.
- **Shop admins/owners** who need to manage the list of services offered, add or remove barbers, and oversee every appointment in the shop (confirm, cancel, or delete).

## Features
- Customer signup/login with secure password hashing (bcrypt) and JWT-based sessions
- Role-based access: `CUSTOMER`, `BARBER`, `ADMIN`
- Browse services (name, price, duration, description)
- Browse barbers, view bios/specialties, like a barber, and read/leave reviews
- Book an appointment with a chosen barber, service, and date/time
- Automatic double-booking prevention (checks for real time-range overlaps against a barber's existing appointments)
- View and cancel your own appointments
- Admin panel: full create/edit/delete for services and barbers, and confirm/cancel/delete for any appointment
- Barber dashboard: create phone customers, book on their behalf, complete appointments, and record payments
- Pay after service with Stripe Checkout in test mode
- Record in-person cash payments or alternative payments such as Zelle, Venmo, or Cash App
- Require and display a note identifying alternative payment types
- Record payment timestamps and support eligible Stripe refunds
- Add appointments to Google Calendar or download an `.ics` calendar event
- Progressive Web App (PWA) support
- Dark/light mode toggle with a persistent theme preference
- Custom branded UI (typography, color palette, signature striped accent)

## Technology
- **Frontend:** React, Vite, plain CSS (custom design system)
- **Backend:** Node.js, Express
- **Database:** PostgreSQL (running in Docker)
- **ORM:** Prisma (schema, migrations, and the query layer — see note below)
- **Auth:** bcrypt (password hashing), jsonwebtoken (JWTs)

> **Note on database access:** this project uses Prisma as its query layer instead of the raw `pg` package. Prisma still connects to PostgreSQL, generates and runs real SQL migrations, and every query is automatically parameterized (protecting against SQL injection) — but queries are written in Prisma's JS-based syntax rather than hand-written SQL strings. Flagging this clearly in case raw `pg` + hand-written parameterized SQL is a strict requirement.

## Database Design
The database has 7 related tables:

- **User** — every person who can log in (customers, barbers, admins), storing name, email, hashed password, and role.
- **BarberProfile** — one-to-one with `User`; extra info only barbers have (bio, specialties, photo). Kept separate so customer rows don't carry unused barber-only columns.
- **Service** — the haircuts/services the shop offers (name, price, duration).
- **Appointment** — the core booking record. Has three foreign keys: `customerId` and `barberId` (both pointing back to `User`, distinguished with named relations since one table links to another twice), and `serviceId`. Also stores `startTime` and a `status` enum (`PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`).
- **Review** — a review a customer leaves on either a barber or a service (the two foreign keys, `barberId` and `serviceId`, are both optional; exactly one is set per row).
- **BarberLike** — a customer "liking" a barber overall, with a composite unique constraint on `(userId, barberId)` so a user can only like a given barber once.

Primary keys are auto-incrementing integers on every table. Foreign keys enforce that an appointment can't reference a nonexistent customer, barber, or service.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Create a new account |
| POST | `/api/auth/login` | Log in, receive a JWT |
| GET | `/api/services` | List all services |
| POST | `/api/services` | Create a service (admin only) |
| PUT | `/api/services/:id` | Update a service (admin only) |
| DELETE | `/api/services/:id` | Delete a service (admin only) |
| GET | `/api/barbers` | List all barbers (with like counts) |
| POST | `/api/barbers` | Create a barber account (admin only) |
| PUT | `/api/barbers/:id` | Update a barber's profile (admin only) |
| DELETE | `/api/barbers/:id` | Delete a barber (admin only) |
| POST | `/api/barbers/:id/like` | Toggle a like on a barber (logged in) |
| GET | `/api/appointments` | List every appointment (admin only) |
| GET | `/api/appointments/mine` | List the logged-in user's own appointments |
| POST | `/api/appointments` | Book a new appointment (logged in) |
| PATCH | `/api/appointments/:id/cancel` | Cancel an appointment (owner or admin) |
| PATCH | `/api/appointments/:id` | Update any field on an appointment (admin only) |
| DELETE | `/api/appointments/:id` | Permanently delete an appointment (admin only) |
| GET | `/api/reviews?barberId=` or `?serviceId=` | Get reviews for a barber or service |
| POST | `/api/reviews` | Submit a review (logged in) |

## Installation Instructions

```
git clone <repository-url>
cd project-name
```

### Backend setup
```
cd apps/backend
npm install
```

Create a `.env` file in `apps/backend` with your own values:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/barbershop-db"
PORT=5000
JWT_SECRET="a-long-random-string"
FRONTEND_URL="http://localhost:5173"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
REMINDER_JOB_SECRET="a-long-random-reminder-secret"
ALLOWED_ORIGINS="http://localhost:5173"
RESEND_API_KEY="re_..."
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

Stripe should remain in test mode for project demonstrations. Resend and Cloudinary values are needed only for the email and media-upload features that use those services.

For deployed environments, set `ALLOWED_ORIGINS` to the exact frontend URL. Multiple allowed frontends can be supplied as a comma-separated list.

Start PostgreSQL (via Docker):
```
npm run db:up
```

Create the database tables:
```
npx prisma migrate dev
```

Seed sample data (test services, users, and barbers):
```
npm run db:seed
```

Start the backend server:
```
npm run dev
```

Run the automated backend checks:

```
npm test
npx prisma validate
```

### Frontend setup
In a separate terminal:
```
cd apps/frontend
npm install
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`).

For a deployed frontend, also set:

```
VITE_API_URL="https://your-backend.example.com/api"
VITE_SHOP_TIME_ZONE="America/New_York"
```

`VITE_SHOP_TIME_ZONE` keeps appointment and payment timestamps consistent across devices. Use the IANA time zone for the shop's location.

For deployment, the backend build command should generate Prisma Client and apply committed migrations before starting the server:

```
npm install && npx prisma generate && npx prisma migrate deploy
```

## Payment Flows

- **Cash:** the assigned barber records the completed appointment as paid.
- **Card:** the customer or assigned barber continues to Stripe Checkout. The appointment is marked paid after a successful test payment is verified.
- **Other:** the barber must identify the payment type, such as Zelle, Venmo, or Cash App. The note is saved with the completed appointment.

### Stripe webhook

Create a Stripe webhook endpoint pointing to:

```
https://your-backend.example.com/api/payments/webhook
```

Subscribe it to `checkout.session.completed` and `checkout.session.async_payment_succeeded`, then save its signing secret as `STRIPE_WEBHOOK_SECRET`. The webhook makes payment recording reliable even when the user closes Stripe without returning to the app.

### Appointment reminders

The repository includes `.github/workflows/appointment-reminders.yml`, which sends a scheduled POST request once per hour to:

```
https://your-backend.example.com/api/reminders/run
```

Add an encrypted GitHub Actions repository secret named `REMINDER_JOB_SECRET` with the same value used by the backend. The workflow includes it in the `x-reminder-secret` header. The job emails the customer and barber about appointments approximately 24 hours away and records `reminderSentAt` to prevent duplicates. Customers without an email are skipped. It can also be tested manually from the repository's Actions tab with **Run workflow**.

Payment receipts are emailed after Cash, Other, or Card payment. Card receipts contain only the card brand and last four digits; full card data is never stored.

For Stripe's standard successful test payment, use card number `4242 4242 4242 4242`, any future expiration date, any three-digit CVC, and a valid-looking ZIP code. Never use a real card while the project is in test mode.

## Final Demonstration Checklist

1. Sign up and log in as a customer.
2. Browse services and barbers, then create and cancel a test appointment.
3. Create a phone customer and appointment from the barber dashboard.
4. Mark an appointment completed and record a Cash payment.
5. Record an Other payment and verify its required note is displayed.
6. Complete a Card payment through Stripe Checkout and verify `CARD` and the paid timestamp appear after returning to the app.
7. Confirm the admin can manage services, barbers, and appointments.
8. Confirm reviews, favorites, calendar links, theme selection, and the PWA still behave as expected.

## Project Status

The application is a completed project MVP intended for demonstration and portfolio use. It includes Stripe webhook handling, critical payment/booking rule tests, restricted CORS, authentication rate limiting, and baseline security headers. Before a real commercial launch, future work should include broader integration and browser tests, password recovery, SMS reminders, and production monitoring.

## AI Usage Reflection

**How did I use AI?** I used Claude throughout the entire build process — planning the database schema, writing backend routes and controllers, debugging errors, building the React frontend, and designing the visual style. I asked for explanations of each concept as we went (relations, middleware, JWTs, async/await) rather than just accepting code.

**What did AI help me understand?** How relational database design actually works in practice (foreign keys, one-to-one vs one-to-many, named relations for a table linking to another table twice), how JWT authentication and middleware chains work, and how to debug real errors methodically instead of guessing.

**What incorrect or incomplete AI response did I encounter?** During a Prisma 7 upgrade, code that worked in earlier tutorials/versions broke because Prisma 7 removed the old `url` field in the schema's datasource block and requires an explicit database "driver adapter" — this wasn't obvious until we hit the actual error message and looked it up together.

**How did I test the AI-generated code?** By running it directly against my own database and API using PowerShell (`Invoke-RestMethod`) to test each endpoint before ever touching the frontend, and by checking real error messages in the terminal rather than assuming code worked.

**What part of the project can I explain without AI assistance?** The overall data model and why each foreign key exists, how the authentication flow works end to end (hash → JWT → middleware → protected route), and how the double-booking prevention logic checks for time overlaps.
