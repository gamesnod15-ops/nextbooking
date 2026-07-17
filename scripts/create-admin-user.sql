-- Creates the first platform_admin account for the manager panel.
-- Login: adminbooking@randevumkolay.com / Admin1234!
-- Password hash is BCrypt (work factor 12), matching BcryptPasswordHasher.
-- Change the password after first login.

INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name,
    phone, job_title, avatar_url, role, is_active, email_verified,
    phone_verified, last_login_at, permissions,
    created_at, created_by, last_modified_at, last_modified_by,
    is_deleted, deleted_at, deleted_by
) VALUES (
    'd1d3e7ab-00c8-42aa-9485-946952f31e22', NULL,
    'adminbooking@randevumkolay.com',
    '$2a$12$qzUXozJh45X2zTRfmDFSTu3KFd4qjmr0gkmpz0yTdu/QpReAi02Sm',
    'Admin', 'Booking',
    NULL, NULL, NULL, 'platform_admin', true, true,
    false, NULL, '{}',
    now(), 'system', NULL, NULL,
    false, NULL, NULL
);
