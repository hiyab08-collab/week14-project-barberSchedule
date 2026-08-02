-- SlicedBy_10 — Database Schema

-- ========== Enum types ==========

CREATE TYPE user_role AS ENUM ('CUSTOMER', 'BARBER', 'ADMIN');
CREATE TYPE appointment_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- ========== users ==========
-- Every person who can log in: customers, barbers, or admins.

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'CUSTOMER',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========== barber_profiles ==========
-- Extra info that ONLY barbers have. One-to-one with users.

CREATE TABLE barber_profiles (
  id SERIAL PRIMARY KEY,
  bio TEXT,
  specialties VARCHAR(255),
  photo_url VARCHAR(500),
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id)
);

-- ========== services ==========
-- The haircuts/services the shop offers.

CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  duration_minutes INTEGER NOT NULL
);

-- ========== appointments ==========
-- The core booking record: a customer, a barber, and a service at a time.

CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  start_time TIMESTAMP NOT NULL,
  status appointment_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  customer_id INTEGER NOT NULL REFERENCES users(id),
  barber_id INTEGER NOT NULL REFERENCES users(id),
  service_id INTEGER NOT NULL REFERENCES services(id)
);

-- ========== reviews ==========
-- A review a customer leaves on EITHER a barber OR a service (never both).

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  media_url VARCHAR(500),
  media_type VARCHAR(20),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  customer_id INTEGER NOT NULL REFERENCES users(id),
  barber_id INTEGER REFERENCES users(id),
  service_id INTEGER REFERENCES services(id)
);

-- ========== barber_likes ==========
-- A customer publicly "liking" a barber overall. One like per user per barber.

CREATE TABLE barber_likes (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  barber_id INTEGER NOT NULL REFERENCES users(id),
  UNIQUE (user_id, barber_id)
);

-- ========== favorites ==========
-- A customer's PRIVATE favorite — either a barber or a service.

CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  barber_id INTEGER REFERENCES users(id),
  service_id INTEGER REFERENCES services(id),
  UNIQUE (user_id, barber_id),
  UNIQUE (user_id, service_id)
);