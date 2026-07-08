INSERT INTO profile (business_name, industry_type, location, monthly_bill, tariff_per_unit, working_hours)
VALUES ('Demo MSME Workshop', 'Manufacturing Workshop', 'Tamil Nadu', 18000, 8.5, 9);

INSERT INTO machines (name, type, rated_kw, threshold_kw, status) VALUES
('Cutting Machine', 'Cutting', 2.5, 2.9, 'running'),
('Air Compressor', 'Compressor', 3.0, 3.3, 'idle'),
('Motor Pump', 'Pump', 1.5, 1.8, 'running'),
('Cooling Fan Unit', 'Cooling', 1.2, 1.5, 'off');

INSERT INTO readings (machine_id, voltage, current_amp, power_kw, energy_kwh, power_factor, status) VALUES
(1, 230, 9.3, 2.14, 2.14, 0.95, 'running'),
(2, 229, 5.7, 1.30, 1.30, 0.82, 'idle'),
(3, 231, 4.7, 1.08, 1.08, 0.94, 'running'),
(4, 230, 0, 0, 0, 0, 'off');

INSERT INTO alerts (machine_id, type, severity, message) VALUES
(2, 'Idle Wastage', 'medium', 'Air Compressor is consuming power while idle. Turn it off if not needed.');

INSERT INTO recommendations (title, description, saving_rupees) VALUES
('Reduce idle running', 'Switch off idle machines after 15 minutes to reduce electricity wastage.', 1200),
('Shift peak load', 'Run heavy machines outside peak usage hours where possible.', 900),
('Improve power factor', 'Use maintenance or capacitor correction for low power factor machines.', 700);
