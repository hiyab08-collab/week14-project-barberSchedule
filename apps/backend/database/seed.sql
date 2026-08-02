-- SlicedBy_10 — Sample Seed Data

-- ========== Services ==========

INSERT INTO services (name, description, price, duration_minutes) VALUES
  ('Haircut', 'Classic haircut, clippers or scissors', 25.00, 30),
  ('Fade', 'Skin fade or taper fade', 30.00, 45),
  ('Beard Trim', 'Shape and trim facial hair', 15.00, 15),
  ('Haircut + Beard Combo', 'Haircut and beard trim together', 35.00, 45);

-- ========== Users ==========
-- NOTE: these password values are placeholders, NOT real bcrypt hashes.
-- The real app always hashes passwords with bcrypt before storing them.

INSERT INTO users (name, email, password, role) VALUES
  ('Maria Lopez', 'maria@example.com', 'placeholder', 'CUSTOMER'),
  ('Jordan Smith', 'jordan@example.com', 'placeholder', 'CUSTOMER'),
  ('Tony Reyes', 'tony@example.com', 'placeholder', 'BARBER'),
  ('Marcus Lee', 'marcus@example.com', 'placeholder', 'BARBER'),
  ('Shop Admin', 'admin@example.com', 'placeholder', 'ADMIN');

-- ========== Barber profiles ==========
-- user_id 3 = Tony Reyes, user_id 4 = Marcus Lee (based on insert order above)

INSERT INTO barber_profiles (bio, specialties, user_id) VALUES
  ('10 years experience, specializes in fades', 'Fades, Line Ups', 3),
  ('Specializes in tapers and beard sculpting', 'Tapers, Beard Sculpting', 4);

-- ========== A sample appointment ==========
-- Maria (user_id 1) booking a Fade (service_id 2) with Tony (user_id 3)

INSERT INTO appointments (start_time, status, customer_id, barber_id, service_id) VALUES
  ('2026-08-15 14:00:00', 'PENDING', 1, 3, 2);

-- ========== Demonstration JOIN ==========
-- Lists every appointment with the customer's name, the barber's name,
-- and the service name/price, joining across all three related tables.

SELECT
  appointments.id,
  appointments.start_time,
  appointments.status,
  customers.name AS customer_name,
  barbers.name AS barber_name,
  services.name AS service_name,
  services.price
FROM appointments
JOIN users AS customers ON appointments.customer_id = customers.id
JOIN users AS barbers ON appointments.barber_id = barbers.id
JOIN services ON appointments.service_id = services.id
ORDER BY appointments.start_time ASC;

-- ========== Additional example queries ==========
-- These demonstrate WHERE, UPDATE, and DELETE directly against the schema.

-- WHERE: find all services under $20
SELECT * FROM services WHERE price < 20.00;

-- UPDATE: mark an appointment as confirmed
UPDATE appointments SET status = 'CONFIRMED' WHERE id = 1;

-- DELETE: remove a cancelled appointment
-- (example only — would need a real matching id to actually run)
DELETE FROM appointments WHERE status = 'CANCELLED' AND id = 999;