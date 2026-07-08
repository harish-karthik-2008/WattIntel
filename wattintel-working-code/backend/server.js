const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "wattintel_db",
  waitForConnections: true,
  connectionLimit: 10,
});

function rand(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

function createReading(machine) {
  const r = Math.random();
  const status = r < 0.15 ? "off" : r < 0.38 ? "idle" : "running";

  let power = 0;
  let pf = 0;

  if (status === "running") {
    power = rand(machine.rated_kw * 0.65, machine.rated_kw * 1.18);
    pf = rand(0.84, 0.98);
  }

  if (status === "idle") {
    power = rand(machine.rated_kw * 0.10, machine.rated_kw * 0.45);
    pf = rand(0.70, 0.90);
  }

  const voltage = rand(220, 240);
  const current = voltage ? Number(((power * 1000) / voltage).toFixed(2)) : 0;

  return { voltage, current_amp: current, power_kw: power, energy_kwh: power, power_factor: pf, status };
}

app.get("/", (req, res) => {
  res.json({ message: "WattIntel API running" });
});

app.get("/api/profile", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM profile ORDER BY id LIMIT 1");
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

app.post("/api/profile", async (req, res, next) => {
  try {
    const p = req.body;
    const [old] = await pool.query("SELECT id FROM profile ORDER BY id LIMIT 1");

    if (old.length) {
      await pool.query(
        "UPDATE profile SET business_name=?, industry_type=?, location=?, monthly_bill=?, tariff_per_unit=?, working_hours=? WHERE id=?",
        [p.business_name, p.industry_type, p.location, p.monthly_bill, p.tariff_per_unit, p.working_hours, old[0].id]
      );
    } else {
      await pool.query(
        "INSERT INTO profile (business_name, industry_type, location, monthly_bill, tariff_per_unit, working_hours) VALUES (?, ?, ?, ?, ?, ?)",
        [p.business_name, p.industry_type, p.location, p.monthly_bill, p.tariff_per_unit, p.working_hours]
      );
    }

    const [rows] = await pool.query("SELECT * FROM profile ORDER BY id LIMIT 1");
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

app.get("/api/machines", async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT m.*, r.voltage, r.current_amp, r.power_kw, r.energy_kwh, r.power_factor, COALESCE(r.status, m.status) AS live_status
      FROM machines m
      LEFT JOIN (
        SELECT r1.*
        FROM readings r1
        JOIN (SELECT machine_id, MAX(id) latest_id FROM readings GROUP BY machine_id) r2
        ON r1.machine_id = r2.machine_id AND r1.id = r2.latest_id
      ) r ON r.machine_id = m.id
      ORDER BY m.id
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

app.post("/api/machines", async (req, res, next) => {
  try {
    const m = req.body;
    await pool.query(
      "INSERT INTO machines (name, type, rated_kw, threshold_kw, status) VALUES (?, ?, ?, ?, 'off')",
      [m.name, m.type, m.rated_kw, m.threshold_kw || Number(m.rated_kw) * 1.15]
    );
    res.json({ message: "Machine added" });
  } catch (err) {
    next(err);
  }
});

app.delete("/api/machines/:id", async (req, res, next) => {
  try {
    await pool.query("DELETE FROM machines WHERE id=?", [req.params.id]);
    res.json({ message: "Machine deleted" });
  } catch (err) {
    next(err);
  }
});

app.post("/api/simulate", async (req, res, next) => {
  try {
    const [machines] = await pool.query("SELECT * FROM machines");
    const alerts = [];

    for (const machine of machines) {
      const reading = createReading(machine);
      await pool.query("UPDATE machines SET status=? WHERE id=?", [reading.status, machine.id]);
      await pool.query(
        "INSERT INTO readings (machine_id, voltage, current_amp, power_kw, energy_kwh, power_factor, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [machine.id, reading.voltage, reading.current_amp, reading.power_kw, reading.energy_kwh, reading.power_factor, reading.status]
      );

      if (reading.status === "idle" && reading.power_kw > 0.2) {
        const msg = `${machine.name} is idle but consuming ${reading.power_kw} kW.`;
        await pool.query("INSERT INTO alerts (machine_id, type, severity, message) VALUES (?, 'Idle Wastage', 'medium', ?)", [machine.id, msg]);
        alerts.push(msg);
      }

      if (reading.power_kw > machine.threshold_kw) {
        const msg = `${machine.name} crossed safe threshold. Current usage is ${reading.power_kw} kW.`;
        await pool.query("INSERT INTO alerts (machine_id, type, severity, message) VALUES (?, 'Abnormal Usage', 'high', ?)", [machine.id, msg]);
        alerts.push(msg);
      }
    }

    res.json({ message: "IoT readings simulated", alerts });
  } catch (err) {
    next(err);
  }
});

app.get("/api/dashboard", async (req, res, next) => {
  try {
    const [[profile]] = await pool.query("SELECT * FROM profile ORDER BY id LIMIT 1");
    const [machines] = await pool.query(`
      SELECT m.*, r.voltage, r.current_amp, r.power_kw, r.energy_kwh, r.power_factor, COALESCE(r.status, m.status) AS live_status
      FROM machines m
      LEFT JOIN (
        SELECT r1.*
        FROM readings r1
        JOIN (SELECT machine_id, MAX(id) latest_id FROM readings GROUP BY machine_id) r2
        ON r1.machine_id = r2.machine_id AND r1.id = r2.latest_id
      ) r ON r.machine_id = m.id
      ORDER BY m.id
    `);
    const [alerts] = await pool.query(`
      SELECT a.*, m.name AS machine_name FROM alerts a
      JOIN machines m ON m.id = a.machine_id
      ORDER BY a.created_at DESC LIMIT 8
    `);
    const [recommendations] = await pool.query("SELECT * FROM recommendations ORDER BY id DESC LIMIT 5");

    const totalKw = machines.reduce((s, m) => s + Number(m.power_kw || 0), 0);
    const dailyUnits = totalKw * Number(profile.working_hours || 8);
    const dailyCost = dailyUnits * Number(profile.tariff_per_unit || 8);
    const suggestedSaving = recommendations.reduce((s, r) => s + Number(r.saving_rupees || 0), 0);

    res.json({
      profile,
      machines,
      alerts,
      recommendations,
      stats: {
        totalKw: Number(totalKw.toFixed(2)),
        dailyUnits: Number(dailyUnits.toFixed(2)),
        dailyCost: Number(dailyCost.toFixed(2)),
        monthlyCost: Number((dailyCost * 30).toFixed(2)),
        suggestedSaving,
        co2Reduction: Number(((suggestedSaving / Number(profile.tariff_per_unit || 8)) * 0.82).toFixed(2)),
        idleCount: machines.filter(m => m.live_status === "idle").length,
      },
    });
  } catch (err) {
    next(err);
  }
});

app.get("/api/report", async (req, res, next) => {
  try {
    const [[profile]] = await pool.query("SELECT * FROM profile ORDER BY id LIMIT 1");
    const [rows] = await pool.query(`
      SELECT m.name, COALESCE(AVG(r.power_kw),0) avg_power, COALESCE(SUM(r.energy_kwh),0) units, COUNT(r.id) readings
      FROM machines m LEFT JOIN readings r ON r.machine_id=m.id
      GROUP BY m.id ORDER BY units DESC
    `);

    const totalUnits = rows.reduce((s, r) => s + Number(r.units || 0), 0);
    const estimatedCost = totalUnits * Number(profile.tariff_per_unit || 8);
    const saving = Math.max(Number(profile.monthly_bill || 0) - estimatedCost, 0);

    res.json({
      rows,
      summary: {
        currentBill: Number(profile.monthly_bill || 0),
        estimatedCost: Number(estimatedCost.toFixed(2)),
        saving: Number(saving.toFixed(2)),
        co2Reduction: Number(((saving / Number(profile.tariff_per_unit || 8)) * 0.82).toFixed(2)),
      },
    });
  } catch (err) {
    next(err);
  }
});

app.get("/api/roi", (req, res) => {
  const cost = Number(req.query.cost || 3000);
  const saving = Number(req.query.saving || 900);
  res.json({
    cost,
    saving,
    yearlySaving: saving * 12,
    paybackMonths: saving ? Number((cost / saving).toFixed(1)) : 0,
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;

pool.getConnection()
  .then((conn) => {
    conn.release();
    app.listen(PORT, () => console.log(`WattIntel backend running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("MySQL connection failed:", err.message);
    process.exit(1);
  });
