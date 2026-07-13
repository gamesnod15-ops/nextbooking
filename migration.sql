CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    migration_id character varying(150) NOT NULL,
    product_version character varying(32) NOT NULL,
    CONSTRAINT pk___ef_migrations_history PRIMARY KEY (migration_id)
);

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE TABLE audit_logs (
        id uuid NOT NULL,
        tenant_id uuid,
        user_id uuid,
        action character varying(100) NOT NULL,
        entity_name character varying(100) NOT NULL,
        entity_id uuid,
        old_values text,
        new_values text,
        ip_address character varying(50),
        user_agent character varying(500),
        created_at timestamp with time zone NOT NULL,
        CONSTRAINT pk_audit_logs PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE TABLE customers (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        name character varying(200) NOT NULL,
        phone character varying(20) NOT NULL,
        email character varying(200),
        notes character varying(2000),
        avatar_url text,
        birth_date date,
        gender text,
        tags text[] NOT NULL,
        is_blocked boolean NOT NULL,
        last_visit_at timestamp with time zone,
        total_visits integer NOT NULL,
        total_spent numeric(10,2) NOT NULL,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_customers PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE TABLE schedule_exceptions (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        employee_id uuid NOT NULL,
        date date NOT NULL,
        is_closed boolean NOT NULL,
        start_time time without time zone,
        end_time time without time zone,
        reason text,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_schedule_exceptions PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE TABLE tenants (
        id uuid NOT NULL,
        name character varying(200) NOT NULL,
        subdomain character varying(100) NOT NULL,
        email character varying(200) NOT NULL,
        plan character varying(50) NOT NULL,
        is_active boolean NOT NULL,
        logo_url character varying(500),
        custom_domain character varying(200),
        settings jsonb NOT NULL,
        created_at timestamp with time zone NOT NULL,
        trial_ends_at timestamp with time zone,
        subscription_ends_at timestamp with time zone,
        CONSTRAINT pk_tenants PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE TABLE users (
        id uuid NOT NULL,
        tenant_id uuid,
        email character varying(200) NOT NULL,
        password_hash character varying(200) NOT NULL,
        first_name character varying(100) NOT NULL,
        last_name character varying(100) NOT NULL,
        phone character varying(20),
        avatar_url character varying(500),
        role character varying(50) NOT NULL,
        is_active boolean NOT NULL,
        email_verified boolean NOT NULL,
        last_login_at timestamp with time zone,
        permissions text[] NOT NULL,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_users PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE TABLE businesses (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        name character varying(200) NOT NULL,
        category integer NOT NULL,
        timezone character varying(50) NOT NULL,
        phone character varying(20),
        email character varying(200),
        address text,
        city character varying(100),
        website text,
        logo_url character varying(500),
        cover_image_url text,
        description text,
        is_active boolean NOT NULL,
        settings jsonb NOT NULL,
        tenant_id1 uuid,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_businesses PRIMARY KEY (id),
        CONSTRAINT fk_businesses_tenants_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE RESTRICT,
        CONSTRAINT fk_businesses_tenants_tenant_id1 FOREIGN KEY (tenant_id1) REFERENCES tenants (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE TABLE refresh_tokens (
        id uuid NOT NULL,
        user_id uuid NOT NULL,
        token_hash character varying(200) NOT NULL,
        device_info character varying(500),
        ip_address character varying(50),
        expires_at timestamp with time zone NOT NULL,
        created_at timestamp with time zone NOT NULL,
        revoked_at timestamp with time zone,
        replaced_by_token_id uuid,
        CONSTRAINT pk_refresh_tokens PRIMARY KEY (id),
        CONSTRAINT fk_refresh_tokens_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE TABLE employees (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        business_id uuid NOT NULL,
        user_id uuid,
        name character varying(200) NOT NULL,
        title character varying(100),
        bio text,
        avatar_url character varying(500),
        phone character varying(20),
        email character varying(200),
        is_active boolean NOT NULL,
        accepts_online_bookings boolean NOT NULL,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_employees PRIMARY KEY (id),
        CONSTRAINT fk_employees_businesses_business_id FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE TABLE services (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        business_id uuid NOT NULL,
        name character varying(200) NOT NULL,
        description character varying(2000),
        duration_minutes integer NOT NULL,
        buffer_minutes integer NOT NULL,
        price numeric(10,2) NOT NULL,
        image_url character varying(500),
        color character varying(20),
        sort_order integer NOT NULL,
        is_active boolean NOT NULL,
        requires_confirmation boolean NOT NULL,
        max_capacity integer,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_services PRIMARY KEY (id),
        CONSTRAINT fk_services_businesses_business_id FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE TABLE schedules (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        employee_id uuid NOT NULL,
        day_of_week integer NOT NULL,
        start_time time without time zone NOT NULL,
        end_time time without time zone NOT NULL,
        is_active boolean NOT NULL,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_schedules PRIMARY KEY (id),
        CONSTRAINT fk_schedules_employees_employee_id FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE TABLE appointments (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        business_id uuid NOT NULL,
        service_id uuid NOT NULL,
        employee_id uuid NOT NULL,
        customer_id uuid NOT NULL,
        start_time timestamp with time zone NOT NULL,
        end_time timestamp with time zone NOT NULL,
        status character varying(50) NOT NULL,
        price numeric(10,2) NOT NULL,
        notes character varying(1000),
        cancellation_reason character varying(500),
        source character varying(50) NOT NULL,
        reminder_sent boolean NOT NULL,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_appointments PRIMARY KEY (id),
        CONSTRAINT fk_appointments_customers_customer_id FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT,
        CONSTRAINT fk_appointments_employees_employee_id FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE RESTRICT,
        CONSTRAINT fk_appointments_services_service_id FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE TABLE employee_services (
        employee_id uuid NOT NULL,
        service_id uuid NOT NULL,
        CONSTRAINT pk_employee_services PRIMARY KEY (employee_id, service_id),
        CONSTRAINT fk_employee_services_employees_employee_id FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
        CONSTRAINT fk_employee_services_services_service_id FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE TABLE payments (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        appointment_id uuid NOT NULL,
        provider character varying(50) NOT NULL,
        provider_payment_id character varying(200),
        provider_conversation_id character varying(200),
        amount numeric(10,2) NOT NULL,
        currency character varying(3) NOT NULL,
        status character varying(50) NOT NULL,
        failure_reason character varying(500),
        metadata jsonb NOT NULL,
        paid_at timestamp with time zone,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_payments PRIMARY KEY (id),
        CONSTRAINT fk_payments_appointments_appointment_id FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE INDEX ix_appointments_customer_id ON appointments (customer_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE INDEX ix_appointments_employee_id_start_time ON appointments (employee_id, start_time);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE INDEX ix_appointments_service_id ON appointments (service_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE INDEX ix_appointments_tenant_id_start_time ON appointments (tenant_id, start_time);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE INDEX ix_audit_logs_tenant_id_created_at ON audit_logs (tenant_id, created_at);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE INDEX ix_businesses_tenant_id ON businesses (tenant_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE INDEX ix_businesses_tenant_id1 ON businesses (tenant_id1);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE INDEX ix_customers_tenant_id_phone ON customers (tenant_id, phone);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE INDEX ix_employee_services_service_id ON employee_services (service_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE INDEX ix_employees_business_id ON employees (business_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE INDEX ix_employees_tenant_id ON employees (tenant_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE UNIQUE INDEX ix_payments_appointment_id ON payments (appointment_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE INDEX ix_payments_tenant_id ON payments (tenant_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE INDEX ix_refresh_tokens_token_hash ON refresh_tokens (token_hash);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE INDEX ix_refresh_tokens_user_id ON refresh_tokens (user_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE INDEX ix_schedules_employee_id ON schedules (employee_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE INDEX ix_services_business_id ON services (business_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE INDEX ix_services_tenant_id ON services (tenant_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE UNIQUE INDEX ix_tenants_subdomain ON tenants (subdomain);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE UNIQUE INDEX ix_users_email ON users (email);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    CREATE INDEX ix_users_tenant_id ON users (tenant_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517121435_InitialCreate') THEN
    INSERT INTO "__EFMigrationsHistory" (migration_id, product_version)
    VALUES ('20260517121435_InitialCreate', '9.0.1');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517220304_AddCampaignCouponPackage') THEN
    CREATE TABLE campaigns (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        name character varying(200) NOT NULL,
        description character varying(2000),
        discount_type character varying(50) NOT NULL,
        discount_value numeric(10,2) NOT NULL,
        start_date timestamp with time zone NOT NULL,
        end_date timestamp with time zone NOT NULL,
        status character varying(50) NOT NULL,
        usage_limit integer,
        usage_count integer NOT NULL,
        applicable_service_ids uuid[] NOT NULL,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_campaigns PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517220304_AddCampaignCouponPackage') THEN
    CREATE TABLE coupons (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        code character varying(50) NOT NULL,
        description character varying(2000),
        discount_type character varying(50) NOT NULL,
        discount_value numeric(10,2) NOT NULL,
        minimum_order_amount numeric(10,2),
        expires_at timestamp with time zone,
        usage_limit integer,
        usage_count integer NOT NULL,
        is_active boolean NOT NULL,
        applicable_service_ids uuid[] NOT NULL,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_coupons PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517220304_AddCampaignCouponPackage') THEN
    CREATE TABLE packages (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        name character varying(200) NOT NULL,
        description character varying(2000),
        price numeric(10,2) NOT NULL,
        original_price numeric(10,2),
        validity_days integer NOT NULL,
        is_active boolean NOT NULL,
        image_url character varying(500),
        items jsonb NOT NULL,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_packages PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517220304_AddCampaignCouponPackage') THEN
    CREATE INDEX ix_campaigns_tenant_id ON campaigns (tenant_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517220304_AddCampaignCouponPackage') THEN
    CREATE UNIQUE INDEX ix_coupons_tenant_id_code ON coupons (tenant_id, code);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517220304_AddCampaignCouponPackage') THEN
    CREATE INDEX ix_packages_tenant_id ON packages (tenant_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260517220304_AddCampaignCouponPackage') THEN
    INSERT INTO "__EFMigrationsHistory" (migration_id, product_version)
    VALUES ('20260517220304_AddCampaignCouponPackage', '9.0.1');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260518061101_AddGiftCoupon') THEN
    CREATE TABLE gift_coupons (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        code character varying(50) NOT NULL,
        amount numeric(10,2) NOT NULL,
        recipient_name character varying(200) NOT NULL,
        recipient_email character varying(200),
        purchased_by character varying(200) NOT NULL,
        purchase_date timestamp with time zone NOT NULL,
        expiry_date timestamp with time zone,
        used_amount numeric(10,2) NOT NULL,
        status character varying(50) NOT NULL,
        message character varying(500),
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_gift_coupons PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260518061101_AddGiftCoupon') THEN
    CREATE UNIQUE INDEX ix_gift_coupons_tenant_id_code ON gift_coupons (tenant_id, code);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260518061101_AddGiftCoupon') THEN
    INSERT INTO "__EFMigrationsHistory" (migration_id, product_version)
    VALUES ('20260518061101_AddGiftCoupon', '9.0.1');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260519062527_AddProfessionalAndBranchFeatures') THEN
    CREATE TABLE branches (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        name character varying(200) NOT NULL,
        address character varying(500),
        city character varying(100),
        phone character varying(20),
        email character varying(200),
        manager_name character varying(200),
        is_active boolean NOT NULL,
        is_main_branch boolean NOT NULL,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_branches PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260519062527_AddProfessionalAndBranchFeatures') THEN
    CREATE TABLE debt_records (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        title character varying(200) NOT NULL,
        creditor_name character varying(200),
        description text,
        total_amount numeric(12,2) NOT NULL,
        paid_amount numeric(12,2) NOT NULL,
        due_date date NOT NULL,
        category character varying(30) NOT NULL,
        status character varying(30) NOT NULL,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_debt_records PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260519062527_AddProfessionalAndBranchFeatures') THEN
    CREATE TABLE employee_commissions (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        employee_id uuid NOT NULL,
        employee_name character varying(200) NOT NULL,
        period character varying(10) NOT NULL,
        type character varying(20) NOT NULL,
        base_amount numeric(12,2) NOT NULL,
        commission_rate numeric(5,2) NOT NULL,
        commission_amount numeric(12,2) NOT NULL,
        bonus_amount numeric(12,2) NOT NULL,
        status character varying(20) NOT NULL,
        notes text,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_employee_commissions PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260519062527_AddProfessionalAndBranchFeatures') THEN
    CREATE TABLE products (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        name character varying(200) NOT NULL,
        description text,
        category character varying(100),
        barcode character varying(100),
        sale_price numeric(12,2) NOT NULL,
        cost_price numeric(12,2),
        stock_quantity integer NOT NULL,
        min_stock_level integer NOT NULL,
        unit character varying(50) NOT NULL,
        is_active boolean NOT NULL,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_products PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260519062527_AddProfessionalAndBranchFeatures') THEN
    CREATE TABLE receivables (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        customer_name character varying(200) NOT NULL,
        customer_phone character varying(20),
        description text,
        total_amount numeric(12,2) NOT NULL,
        paid_amount numeric(12,2) NOT NULL,
        due_date date NOT NULL,
        status character varying(30) NOT NULL,
        installment_count integer NOT NULL,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_receivables PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260519062527_AddProfessionalAndBranchFeatures') THEN
    CREATE TABLE installments (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        receivable_id uuid NOT NULL,
        installment_number integer NOT NULL,
        amount numeric(12,2) NOT NULL,
        due_date date NOT NULL,
        is_paid boolean NOT NULL,
        paid_at date,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_installments PRIMARY KEY (id),
        CONSTRAINT fk_installments_receivables_receivable_id FOREIGN KEY (receivable_id) REFERENCES receivables (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260519062527_AddProfessionalAndBranchFeatures') THEN
    CREATE INDEX ix_branches_tenant_id ON branches (tenant_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260519062527_AddProfessionalAndBranchFeatures') THEN
    CREATE INDEX ix_debt_records_tenant_id ON debt_records (tenant_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260519062527_AddProfessionalAndBranchFeatures') THEN
    CREATE INDEX ix_employee_commissions_tenant_id_employee_id_period ON employee_commissions (tenant_id, employee_id, period);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260519062527_AddProfessionalAndBranchFeatures') THEN
    CREATE INDEX ix_installments_receivable_id ON installments (receivable_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260519062527_AddProfessionalAndBranchFeatures') THEN
    CREATE INDEX ix_installments_tenant_id_receivable_id ON installments (tenant_id, receivable_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260519062527_AddProfessionalAndBranchFeatures') THEN
    CREATE INDEX ix_products_tenant_id ON products (tenant_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260519062527_AddProfessionalAndBranchFeatures') THEN
    CREATE INDEX ix_receivables_tenant_id ON receivables (tenant_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260519062527_AddProfessionalAndBranchFeatures') THEN
    INSERT INTO "__EFMigrationsHistory" (migration_id, product_version)
    VALUES ('20260519062527_AddProfessionalAndBranchFeatures', '9.0.1');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260519161411_AddUserJobTitle') THEN
    ALTER TABLE users ADD job_title text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260519161411_AddUserJobTitle') THEN
    INSERT INTO "__EFMigrationsHistory" (migration_id, product_version)
    VALUES ('20260519161411_AddUserJobTitle', '9.0.1');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260519163209_AvatarUrlText') THEN
    ALTER TABLE users ALTER COLUMN job_title TYPE character varying(100);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260519163209_AvatarUrlText') THEN
    ALTER TABLE users ALTER COLUMN avatar_url TYPE text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260519163209_AvatarUrlText') THEN
    INSERT INTO "__EFMigrationsHistory" (migration_id, product_version)
    VALUES ('20260519163209_AvatarUrlText', '9.0.1');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260520182457_AddAdvertisements') THEN
    CREATE TABLE advertisements (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        title character varying(200) NOT NULL,
        description character varying(1000),
        package_type character varying(50) NOT NULL,
        target_category character varying(50) NOT NULL,
        target_location character varying(200),
        budget numeric(10,2) NOT NULL,
        start_date timestamp with time zone NOT NULL,
        end_date timestamp with time zone NOT NULL,
        status character varying(50) NOT NULL,
        impressions integer NOT NULL,
        clicks integer NOT NULL,
        conversions integer NOT NULL,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_advertisements PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260520182457_AddAdvertisements') THEN
    CREATE INDEX ix_advertisements_tenant_id ON advertisements (tenant_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260520182457_AddAdvertisements') THEN
    CREATE INDEX ix_advertisements_tenant_id_status ON advertisements (tenant_id, status);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260520182457_AddAdvertisements') THEN
    INSERT INTO "__EFMigrationsHistory" (migration_id, product_version)
    VALUES ('20260520182457_AddAdvertisements', '9.0.1');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260527112245_AddPostalCodeAndCountryToBusiness') THEN
    ALTER TABLE businesses ADD country character varying(100);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260527112245_AddPostalCodeAndCountryToBusiness') THEN
    ALTER TABLE businesses ADD postal_code character varying(20);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260527112245_AddPostalCodeAndCountryToBusiness') THEN
    CREATE TABLE user_auth_providers (
        id uuid NOT NULL,
        user_id uuid NOT NULL,
        provider character varying(50) NOT NULL,
        provider_user_id character varying(200) NOT NULL,
        email character varying(200),
        full_name character varying(200),
        avatar_url character varying(500),
        created_at timestamp with time zone NOT NULL,
        last_login_at timestamp with time zone,
        CONSTRAINT pk_user_auth_providers PRIMARY KEY (id),
        CONSTRAINT fk_user_auth_providers_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260527112245_AddPostalCodeAndCountryToBusiness') THEN
    CREATE UNIQUE INDEX ix_user_auth_providers_provider_provider_user_id ON user_auth_providers (provider, provider_user_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260527112245_AddPostalCodeAndCountryToBusiness') THEN
    CREATE INDEX ix_user_auth_providers_user_id ON user_auth_providers (user_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260527112245_AddPostalCodeAndCountryToBusiness') THEN
    INSERT INTO "__EFMigrationsHistory" (migration_id, product_version)
    VALUES ('20260527112245_AddPostalCodeAndCountryToBusiness', '9.0.1');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260527115253_AddPaymentCards') THEN
    CREATE TABLE payment_cards (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        brand character varying(50) NOT NULL,
        last_four_digits character varying(4) NOT NULL,
        expiry_month character varying(2) NOT NULL,
        expiry_year character varying(4) NOT NULL,
        card_holder_name character varying(200) NOT NULL,
        is_default boolean NOT NULL,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_payment_cards PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260527115253_AddPaymentCards') THEN
    CREATE INDEX ix_payment_cards_tenant_id_is_default ON payment_cards (tenant_id, is_default);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260527115253_AddPaymentCards') THEN
    INSERT INTO "__EFMigrationsHistory" (migration_id, product_version)
    VALUES ('20260527115253_AddPaymentCards', '9.0.1');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260527115845_AddTaxNumberAndTaxOfficeToBusiness') THEN
    ALTER TABLE businesses ADD tax_number character varying(50);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260527115845_AddTaxNumberAndTaxOfficeToBusiness') THEN
    ALTER TABLE businesses ADD tax_office character varying(200);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260527115845_AddTaxNumberAndTaxOfficeToBusiness') THEN
    INSERT INTO "__EFMigrationsHistory" (migration_id, product_version)
    VALUES ('20260527115845_AddTaxNumberAndTaxOfficeToBusiness', '9.0.1');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260531120120_ChangeLogoUrlToText') THEN
    ALTER TABLE tenants ALTER COLUMN logo_url TYPE text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260531120120_ChangeLogoUrlToText') THEN
    ALTER TABLE businesses ALTER COLUMN logo_url TYPE text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260531120120_ChangeLogoUrlToText') THEN
    INSERT INTO "__EFMigrationsHistory" (migration_id, product_version)
    VALUES ('20260531120120_ChangeLogoUrlToText', '9.0.1');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260531121001_AddBusinessGalleryImages') THEN
    ALTER TABLE businesses ADD gallery_images jsonb NOT NULL DEFAULT '{}';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260531121001_AddBusinessGalleryImages') THEN
    INSERT INTO "__EFMigrationsHistory" (migration_id, product_version)
    VALUES ('20260531121001_AddBusinessGalleryImages', '9.0.1');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260531121346_FixGalleryImagesDefault') THEN
    UPDATE "businesses" SET "gallery_images" = '[]'::jsonb WHERE "gallery_images" IS NULL OR "gallery_images" = '""'
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260531121346_FixGalleryImagesDefault') THEN
    ALTER TABLE businesses ALTER COLUMN gallery_images SET DEFAULT ('[]'::jsonb);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260531121346_FixGalleryImagesDefault') THEN
    INSERT INTO "__EFMigrationsHistory" (migration_id, product_version)
    VALUES ('20260531121346_FixGalleryImagesDefault', '9.0.1');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260531122034_FixEmptyGalleryImages') THEN
    INSERT INTO "__EFMigrationsHistory" (migration_id, product_version)
    VALUES ('20260531122034_FixEmptyGalleryImages', '9.0.1');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260531123207_AddReviewEntity') THEN
    CREATE TABLE reviews (
        id uuid NOT NULL,
        business_id uuid NOT NULL,
        author_name character varying(100) NOT NULL,
        rating integer NOT NULL,
        comment character varying(2000),
        created_at timestamp with time zone NOT NULL,
        is_approved boolean NOT NULL,
        CONSTRAINT pk_reviews PRIMARY KEY (id),
        CONSTRAINT fk_reviews_businesses_business_id FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260531123207_AddReviewEntity') THEN
    CREATE INDEX ix_reviews_business_id ON reviews (business_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260531123207_AddReviewEntity') THEN
    INSERT INTO "__EFMigrationsHistory" (migration_id, product_version)
    VALUES ('20260531123207_AddReviewEntity', '9.0.1');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260531135250_AddProductPurchaseEntity') THEN
    CREATE TABLE product_purchases (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        product_type character varying(50) NOT NULL,
        plan_name character varying(100) NOT NULL,
        amount numeric(18,2) NOT NULL,
        status character varying(20) NOT NULL,
        start_date timestamp with time zone,
        end_date timestamp with time zone,
        receivable_id uuid,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_product_purchases PRIMARY KEY (id),
        CONSTRAINT fk_product_purchases_receivables_receivable_id FOREIGN KEY (receivable_id) REFERENCES receivables (id) ON DELETE SET NULL
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260531135250_AddProductPurchaseEntity') THEN
    CREATE INDEX ix_product_purchases_receivable_id ON product_purchases (receivable_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260531135250_AddProductPurchaseEntity') THEN
    CREATE INDEX ix_product_purchases_tenant_id ON product_purchases (tenant_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260531135250_AddProductPurchaseEntity') THEN
    INSERT INTO "__EFMigrationsHistory" (migration_id, product_version)
    VALUES ('20260531135250_AddProductPurchaseEntity', '9.0.1');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260604035541_AddQueueWaitingListSurveyFormEntities') THEN
    CREATE TABLE custom_forms (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        business_id uuid NOT NULL,
        title character varying(200) NOT NULL,
        description character varying(1000),
        fields jsonb NOT NULL,
        is_active boolean NOT NULL,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_custom_forms PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260604035541_AddQueueWaitingListSurveyFormEntities') THEN
    CREATE TABLE form_submissions (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        form_id uuid NOT NULL,
        customer_name character varying(200),
        customer_phone character varying(20),
        data jsonb NOT NULL,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_form_submissions PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260604035541_AddQueueWaitingListSurveyFormEntities') THEN
    CREATE TABLE queue_items (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        business_id uuid NOT NULL,
        queue_number integer NOT NULL,
        customer_name character varying(200) NOT NULL,
        customer_phone character varying(20),
        service_id uuid,
        employee_id uuid,
        status character varying(20) NOT NULL,
        estimated_wait_minutes integer NOT NULL,
        called_at timestamp with time zone,
        notes character varying(500),
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_queue_items PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260604035541_AddQueueWaitingListSurveyFormEntities') THEN
    CREATE TABLE surveys (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        business_id uuid NOT NULL,
        appointment_id uuid,
        customer_name character varying(200),
        rating integer NOT NULL,
        comment character varying(2000),
        is_approved boolean NOT NULL,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_surveys PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260604035541_AddQueueWaitingListSurveyFormEntities') THEN
    CREATE TABLE waiting_list_entries (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        business_id uuid NOT NULL,
        customer_name character varying(200) NOT NULL,
        customer_phone character varying(20),
        service_id uuid,
        employee_id uuid,
        preferred_date date,
        preferred_time time without time zone,
        status character varying(20) NOT NULL,
        notes character varying(500),
        notified_at timestamp with time zone,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_waiting_list_entries PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260604035541_AddQueueWaitingListSurveyFormEntities') THEN
    CREATE INDEX ix_custom_forms_tenant_id ON custom_forms (tenant_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260604035541_AddQueueWaitingListSurveyFormEntities') THEN
    CREATE INDEX ix_form_submissions_form_id ON form_submissions (form_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260604035541_AddQueueWaitingListSurveyFormEntities') THEN
    CREATE INDEX ix_form_submissions_tenant_id ON form_submissions (tenant_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260604035541_AddQueueWaitingListSurveyFormEntities') THEN
    CREATE INDEX ix_queue_items_business_id_queue_number ON queue_items (business_id, queue_number);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260604035541_AddQueueWaitingListSurveyFormEntities') THEN
    CREATE INDEX ix_queue_items_tenant_id ON queue_items (tenant_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260604035541_AddQueueWaitingListSurveyFormEntities') THEN
    CREATE INDEX ix_surveys_appointment_id ON surveys (appointment_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260604035541_AddQueueWaitingListSurveyFormEntities') THEN
    CREATE INDEX ix_surveys_business_id ON surveys (business_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260604035541_AddQueueWaitingListSurveyFormEntities') THEN
    CREATE INDEX ix_surveys_tenant_id ON surveys (tenant_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260604035541_AddQueueWaitingListSurveyFormEntities') THEN
    CREATE INDEX ix_waiting_list_entries_tenant_id ON waiting_list_entries (tenant_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260604035541_AddQueueWaitingListSurveyFormEntities') THEN
    INSERT INTO "__EFMigrationsHistory" (migration_id, product_version)
    VALUES ('20260604035541_AddQueueWaitingListSurveyFormEntities', '9.0.1');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260606122448_DisableEmailVerification') THEN
    ALTER TABLE users ADD phone_verified boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260606122448_DisableEmailVerification') THEN
    INSERT INTO "__EFMigrationsHistory" (migration_id, product_version)
    VALUES ('20260606122448_DisableEmailVerification', '9.0.1');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260608120144_FixDecimalNullables') THEN
    CREATE TABLE customer_recommendations (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        customer_id uuid NOT NULL,
        recommendation_type integer NOT NULL,
        title character varying(200) NOT NULL,
        description character varying(500),
        recommended_service_id uuid,
        recommended_product_id uuid,
        relevance_score numeric(5,4) NOT NULL,
        reason character varying(500),
        is_viewed boolean NOT NULL,
        is_clicked boolean NOT NULL,
        is_converted boolean NOT NULL,
        expires_at timestamp with time zone,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_customer_recommendations PRIMARY KEY (id),
        CONSTRAINT fk_customer_recommendations_customers_customer_id FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT,
        CONSTRAINT fk_customer_recommendations_products_recommended_product_id FOREIGN KEY (recommended_product_id) REFERENCES products (id) ON DELETE RESTRICT,
        CONSTRAINT fk_customer_recommendations_services_recommended_service_id FOREIGN KEY (recommended_service_id) REFERENCES services (id) ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260608120144_FixDecimalNullables') THEN
    CREATE TABLE deposits (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        appointment_id uuid NOT NULL,
        customer_id uuid,
        amount numeric(18,2) NOT NULL,
        currency character varying(5) NOT NULL DEFAULT 'TRY',
        status integer NOT NULL,
        payment_method character varying(50) NOT NULL,
        payment_provider character varying(100),
        provider_payment_id character varying(500),
        paid_at timestamp with time zone,
        refunded_at timestamp with time zone,
        notes character varying(500),
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_deposits PRIMARY KEY (id),
        CONSTRAINT fk_deposits_appointments_appointment_id FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260608120144_FixDecimalNullables') THEN
    CREATE TABLE no_show_predictions (
        id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        appointment_id uuid NOT NULL,
        customer_id uuid NOT NULL,
        probability numeric(5,4) NOT NULL,
        risk_level character varying(50) NOT NULL,
        factors character varying(1000),
        requires_deposit boolean NOT NULL,
        recommended_deposit_amount numeric(18,2),
        actual_no_show boolean,
        predicted_at timestamp with time zone NOT NULL,
        created_at timestamp with time zone NOT NULL,
        created_by text NOT NULL,
        last_modified_at timestamp with time zone,
        last_modified_by text,
        is_deleted boolean NOT NULL,
        deleted_at timestamp with time zone,
        deleted_by text,
        CONSTRAINT pk_no_show_predictions PRIMARY KEY (id),
        CONSTRAINT fk_no_show_predictions_appointments_appointment_id FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE RESTRICT,
        CONSTRAINT fk_no_show_predictions_customers_customer_id FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260608120144_FixDecimalNullables') THEN
    CREATE INDEX ix_customer_recommendations_customer_id ON customer_recommendations (customer_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260608120144_FixDecimalNullables') THEN
    CREATE INDEX ix_customer_recommendations_customer_id_recommendation_type_re ON customer_recommendations (customer_id, recommendation_type, relevance_score);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260608120144_FixDecimalNullables') THEN
    CREATE INDEX ix_customer_recommendations_recommendation_type ON customer_recommendations (recommendation_type);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260608120144_FixDecimalNullables') THEN
    CREATE INDEX ix_customer_recommendations_recommended_product_id ON customer_recommendations (recommended_product_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260608120144_FixDecimalNullables') THEN
    CREATE INDEX ix_customer_recommendations_recommended_service_id ON customer_recommendations (recommended_service_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260608120144_FixDecimalNullables') THEN
    CREATE INDEX ix_customer_recommendations_tenant_id ON customer_recommendations (tenant_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260608120144_FixDecimalNullables') THEN
    CREATE INDEX ix_deposits_appointment_id ON deposits (appointment_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260608120144_FixDecimalNullables') THEN
    CREATE INDEX ix_deposits_status ON deposits (status);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260608120144_FixDecimalNullables') THEN
    CREATE INDEX ix_deposits_tenant_id ON deposits (tenant_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260608120144_FixDecimalNullables') THEN
    CREATE UNIQUE INDEX ix_no_show_predictions_appointment_id ON no_show_predictions (appointment_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260608120144_FixDecimalNullables') THEN
    CREATE INDEX ix_no_show_predictions_customer_id ON no_show_predictions (customer_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260608120144_FixDecimalNullables') THEN
    CREATE INDEX ix_no_show_predictions_risk_level ON no_show_predictions (risk_level);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260608120144_FixDecimalNullables') THEN
    CREATE INDEX ix_no_show_predictions_tenant_id ON no_show_predictions (tenant_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260608120144_FixDecimalNullables') THEN
    INSERT INTO "__EFMigrationsHistory" (migration_id, product_version)
    VALUES ('20260608120144_FixDecimalNullables', '9.0.1');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260713213809_AddLatitudeLongitude') THEN
    ALTER TABLE businesses ADD latitude double precision;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260713213809_AddLatitudeLongitude') THEN
    ALTER TABLE businesses ADD longitude double precision;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260713213809_AddLatitudeLongitude') THEN
    INSERT INTO "__EFMigrationsHistory" (migration_id, product_version)
    VALUES ('20260713213809_AddLatitudeLongitude', '9.0.1');
    END IF;
END $EF$;
COMMIT;

