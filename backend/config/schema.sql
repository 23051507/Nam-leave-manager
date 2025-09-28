-- Script de création de la base de données pour NAMS Leave Manager
-- Exécuter ce script dans PostgreSQL pour créer toutes les tables

-- Extension pour les UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des utilisateurs
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('EMPLOYEE', 'COORDINATOR', 'HR', 'ADMIN')),
    manager_id INT REFERENCES users(id),
    service VARCHAR(100),
    position VARCHAR(100),
    annual_leave_alloc INT DEFAULT 20,
    hire_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des types de congés
CREATE TABLE leave_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    affects_annual_balance BOOLEAN DEFAULT true,
    requires_hr_approval BOOLEAN DEFAULT false,
    max_days_per_year INT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des demandes de congés
CREATE TABLE leave_requests (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) NOT NULL,
    leave_type_id INT REFERENCES leave_types(id) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count DECIMAL(5,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'REQUEST_CHANGE')),
    justification TEXT,
    attachment_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT REFERENCES users(id) NOT NULL
);

-- Table des approbations
CREATE TABLE leave_approvals (
    id SERIAL PRIMARY KEY,
    request_id INT REFERENCES leave_requests(id) ON DELETE CASCADE,
    approver_id INT REFERENCES users(id) NOT NULL,
    role VARCHAR(50) NOT NULL,
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('APPROVED', 'REJECTED', 'PENDING', 'REQUEST_CHANGE')),
    comment TEXT,
    decided_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des soldes de congés
CREATE TABLE leave_balances (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) NOT NULL,
    year INT NOT NULL,
    leave_type_id INT REFERENCES leave_types(id) NOT NULL,
    total_allocated DECIMAL(6,2) DEFAULT 0,
    consumed DECIMAL(6,2) DEFAULT 0,
    remaining DECIMAL(6,2) GENERATED ALWAYS AS (total_allocated - consumed) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, year, leave_type_id)
);

-- Table des notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    related_request_id INT REFERENCES leave_requests(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des jours fériés
CREATE TABLE holidays (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_recurring BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date)
);

-- Table des paramètres de l'entreprise
CREATE TABLE company_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by INT REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table d'audit pour les actions importantes
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_manager ON users(manager_id);
CREATE INDEX idx_leave_requests_user ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_leave_approvals_request ON leave_approvals(request_id);
CREATE INDEX idx_leave_balances_user_year ON leave_balances(user_id, year);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);

-- Triggers pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON leave_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertion des types de congés par défaut
INSERT INTO leave_types (name, code, description, affects_annual_balance, requires_hr_approval, max_days_per_year) VALUES
('Congé annuel', 'ANNUAL', 'Congé annuel standard', true, false, NULL),
('Congé maladie', 'SICK', 'Congé pour maladie', false, true, NULL),
('Congé maternité', 'MATERNITY', 'Congé de maternité', false, true, NULL),
('Congé paternité', 'PATERNITY', 'Congé de paternité', false, true, NULL),
('Congé exceptionnel', 'EXCEPTIONAL', 'Congé exceptionnel', false, true, 5),
('Congé sans solde', 'UNPAID', 'Congé sans solde', false, true, NULL);

-- Insertion des paramètres par défaut
INSERT INTO company_settings (setting_key, setting_value, description) VALUES
('annual_leave_days', '25', 'Nombre de jours de congé annuel par défaut'),
('working_days_per_week', '5', 'Nombre de jours ouvrables par semaine'),
('max_consecutive_days', '15', 'Nombre maximum de jours consécutifs'),
('advance_notice_days', '7', 'Délai de prévenance minimum en jours'),
('auto_approve_days', '3', 'Auto-approbation pour les congés de moins de X jours');





