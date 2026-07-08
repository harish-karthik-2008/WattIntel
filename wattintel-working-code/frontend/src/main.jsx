import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import "./style.css";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

function Stat({ title, value, sub }) {
  return (
    <div className="stat">
      <p>{title}</p>
      <h2>{value}</h2>
      <span>{sub}</span>
    </div>
  );
}

function App() {
  const [tab, setTab] = useState("dashboard");
  const [data, setData] = useState(null);
  const [report, setReport] = useState(null);
  const [roi, setRoi] = useState(null);
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState({
    business_name: "",
    industry_type: "",
    location: "",
    monthly_bill: 0,
    tariff_per_unit: 8,
    working_hours: 8,
  });
  const [machine, setMachine] = useState({
    name: "",
    type: "",
    rated_kw: "",
    threshold_kw: "",
  });
  const [chat, setChat] = useState([
    { from: "bot", text: "Ask me how to reduce MSME electricity cost." },
  ]);
  const [question, setQuestion] = useState("");

  async function load() {
  try {
    const { data } = await api.get("/dashboard");
    setData(data);
    setProfile(data.profile);
  } catch {
    const demo = {
      profile: {
        business_name: "Demo MSME Workshop",
        industry_type: "Manufacturing Workshop",
        location: "Tamil Nadu",
        monthly_bill: 18000,
        tariff_per_unit: 8.5,
        working_hours: 9,
      },
      machines: [
        { id: 1, name: "Cutting Machine", type: "Cutting", live_status: "running", power_kw: 2.01, voltage: 237, current_amp: 8.47, power_factor: 0.87, energy_kwh: 2.01 },
        { id: 2, name: "Air Compressor", type: "Compressor", live_status: "idle", power_kw: 1.17, voltage: 224, current_amp: 5.22, power_factor: 0.78, energy_kwh: 1.17 },
        { id: 3, name: "Motor Pump", type: "Pump", live_status: "off", power_kw: 0, voltage: 229, current_amp: 0, power_factor: 0, energy_kwh: 0 },
      ],
      alerts: [],
      recommendations: [
        { id: 1, title: "Reduce idle running", description: "Switch off idle machines to reduce power wastage.", saving_rupees: 1200 },
      ],
      stats: {
        totalKw: 4.52,
        dailyUnits: 40.68,
        dailyCost: 345.78,
        monthlyCost: 10373.4,
        idleCount: 1,
        co2Reduction: 270.12,
      },
    };

    setData(demo);
    setProfile(demo.profile);
  }
}

  async function loadReport() {
  try {
    const [{ data: r }, { data: ro }] = await Promise.all([
      api.get("/report"),
      api.get("/roi?cost=3000&saving=900"),
    ]);
    setReport(r);
    setRoi(ro);
  } catch {
    setReport({
      rows: [
        { name: "Air Compressor", avg_power: 1.88, units: 5.65, readings: 3 },
        { name: "Cutting Machine", avg_power: 1.68, units: 5.04, readings: 3 },
      ],
      summary: {
        currentBill: 18000,
        estimatedCost: 112.63,
        saving: 17887.38,
        co2Reduction: 1725.61,
      },
    });

    setRoi({
      paybackMonths: 3.3,
      yearlySaving: 10800,
    });
  }
}

  useEffect(() => {
    load();
    loadReport();
  }, []);

  async function simulate() {
  try {
    await api.post("/simulate");
    await load();
    await loadReport();
  } catch {
    await load();
    await loadReport();
  }

  setMessage("New IoT readings generated.");
}

  async function saveProfile(e) {
    e.preventDefault();
    await api.post("/profile", profile);
    await load();
    setMessage("Profile saved.");
  }

  async function addMachine(e) {
    e.preventDefault();
    await api.post("/machines", machine);
    setMachine({ name: "", type: "", rated_kw: "", threshold_kw: "" });
    await load();
    setMessage("Machine added.");
  }

  async function deleteMachine(id) {
    await api.delete(`/machines/${id}`);
    await load();
  }

  function ask(e) {
    e.preventDefault();
    const q = question.toLowerCase();
    let ans = "WattIntel monitors machine-level energy, detects idle wastage, gives alerts, and suggests savings.";
    if (q.includes("bill") || q.includes("cost")) ans = "High bill may be due to idle machines, peak usage, low power factor, or inefficient motors.";
    if (q.includes("roi")) ans = "ROI = device cost divided by monthly saving. Example: ₹3000 / ₹900 = 3.3 months.";
    if (q.includes("compressor")) ans = "Compressors waste power when idle. Auto cut-off after 15 minutes can save cost.";
    setChat([...chat, { from: "user", text: question }, { from: "bot", text: ans }]);
    setQuestion("");
  }

if (!data) {
  return (
    <div className="loading">
      Backend is not connected online. Use local version for full demo.
    </div>
  );
}

  return (
    <div className="app">
      <aside>
        <div className="brand">⚡ <span>WattIntel</span></div>
        <p className="tag">Smart Energy Intelligence for MSMEs</p>
        {["dashboard", "profile", "machines", "report", "assistant"].map((x) => (
          <button className={tab === x ? "active" : ""} onClick={() => setTab(x)} key={x}>
            {x.charAt(0).toUpperCase() + x.slice(1)}
          </button>
        ))}
        <div className="fit">
          <b>Theme</b>
          <span>Energy Efficiency</span>
          <span>Product / AI Solution</span>
        </div>
      </aside>

      <main>
        {message && <div className="msg">{message}</div>}

        {tab === "dashboard" && (
          <>
            <section className="hero">
              <div>
                <p className="mini">Real-time Energy Dashboard</p>
                <h1>{data.profile.business_name}</h1>
                <p>Monitor machine-level usage, detect idle wastage, and reduce electricity cost.</p>
              </div>
              <button className="primary" onClick={simulate}>Simulate IoT Reading</button>
            </section>

            <div className="grid">
              <Stat title="Current Load" value={`${data.stats.totalKw} kW`} sub="Live machine load" />
              <Stat title="Daily Units" value={`${data.stats.dailyUnits} kWh`} sub="Estimated usage" />
              <Stat title="Daily Cost" value={`₹${data.stats.dailyCost}`} sub="Based on tariff" />
              <Stat title="Monthly Cost" value={`₹${data.stats.monthlyCost}`} sub="Estimated" />
              <Stat title="Idle Machines" value={data.stats.idleCount} sub="Wastage risk" />
              <Stat title="CO₂ Reduced" value={`${data.stats.co2Reduction} kg`} sub="Monthly estimate" />
            </div>

            <section className="panel">
              <h2>Machine Monitoring</h2>
              <MachineTable machines={data.machines} />
            </section>

            <div className="two">
              <section className="panel">
                <h2>Alerts</h2>
                {data.alerts.map((a) => (
                  <div className={"alert " + a.severity} key={a.id}>
                    <b>{a.type}</b>
                    <p>{a.message}</p>
                  </div>
                ))}
              </section>

              <section className="panel">
                <h2>Recommendations</h2>
                {data.recommendations.map((r) => (
                  <div className="rec" key={r.id}>
                    <b>{r.title}</b>
                    <p>{r.description}</p>
                    <span>Save ₹{r.saving_rupees}/month</span>
                  </div>
                ))}
              </section>
            </div>
          </>
        )}

        {/* {tab === "profile" && (
          <section className="panel">
            <h1>MSME Profile</h1>
            <form className="form" onSubmit={saveProfile}>
              <input placeholder="Business Name" value={profile.business_name} onChange={(e) => setProfile({ ...profile, business_name: e.target.value })} />
              <input placeholder="Industry Type" value={profile.industry_type} onChange={(e) => setProfile({ ...profile, industry_type: e.target.value })} />
              <input placeholder="Location" value={profile.location || ""} onChange={(e) => setProfile({ ...profile, location: e.target.value })} />
              <input type="number" placeholder="Monthly Bill" value={profile.monthly_bill} onChange={(e) => setProfile({ ...profile, monthly_bill: e.target.value })} />
              <input type="number" placeholder="Tariff per Unit" value={profile.tariff_per_unit} onChange={(e) => setProfile({ ...profile, tariff_per_unit: e.target.value })} />
              <input type="number" placeholder="Working Hours" value={profile.working_hours} onChange={(e) => setProfile({ ...profile, working_hours: e.target.value })} />
              <button className="primary">Save Profile</button>
            </form>
          </section>
        )} */}
        {tab === "profile" && (
          <section className="panel">
            <h1>MSME Profile</h1>
            <p className="section-info">
              This profile is used to calculate electricity cost, savings, ROI, and energy wastage for the MSME unit.
            </p>

            <form className="form" onSubmit={saveProfile}>
              <label>
                Business Name
                <input
                  placeholder="Enter MSME business name"
                  value={profile.business_name}
                  onChange={(e) =>
                    setProfile({ ...profile, business_name: e.target.value })
                  }
                />
              </label>

              <label>
                Industry Type
                <input
                  placeholder="Example: Manufacturing Workshop"
                  value={profile.industry_type}
                  onChange={(e) =>
                    setProfile({ ...profile, industry_type: e.target.value })
                  }
                />
              </label>

              <label>
                Location
                <input
                  placeholder="Example: Tamil Nadu"
                  value={profile.location || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, location: e.target.value })
                  }
                />
              </label>

              <label>
                Monthly Electricity Bill ₹
                <input
                  type="number"
                  placeholder="Example: 18000"
                  value={profile.monthly_bill}
                  onChange={(e) =>
                    setProfile({ ...profile, monthly_bill: e.target.value })
                  }
                />
              </label>

              <label>
                Tariff Per Unit ₹
                <input
                  type="number"
                  step="0.01"
                  placeholder="Example: 8.50"
                  value={profile.tariff_per_unit}
                  onChange={(e) =>
                    setProfile({ ...profile, tariff_per_unit: e.target.value })
                  }
                />
              </label>

              <label>
                Working Hours Per Day
                <input
                  type="number"
                  placeholder="Example: 9"
                  value={profile.working_hours}
                  onChange={(e) =>
                    setProfile({ ...profile, working_hours: e.target.value })
                  }
                />
              </label>

              <button className="primary">Save Profile</button>
            </form>
          </section>
        )}

        {tab === "machines" && (
          <section className="panel">
            <h1>Machines</h1>
            <form className="form" onSubmit={addMachine}>
              <input placeholder="Machine Name" value={machine.name} onChange={(e) => setMachine({ ...machine, name: e.target.value })} required />
              <input placeholder="Machine Type" value={machine.type} onChange={(e) => setMachine({ ...machine, type: e.target.value })} />
              <input type="number" step="0.01" placeholder="Rated kW" value={machine.rated_kw} onChange={(e) => setMachine({ ...machine, rated_kw: e.target.value })} required />
              <input type="number" step="0.01" placeholder="Threshold kW" value={machine.threshold_kw} onChange={(e) => setMachine({ ...machine, threshold_kw: e.target.value })} />
              <button className="primary">Add Machine</button>
            </form>
            <MachineTable machines={data.machines} />
            <div className="deleteRow">
              {data.machines.map((m) => (
                <button onClick={() => deleteMachine(m.id)} key={m.id}>Delete {m.name}</button>
              ))}
            </div>
          </section>
        )}

        {tab === "report" && report && roi && (
          <>
            <section className="hero">
              <div>
                <p className="mini">Report & ROI</p>
                <h1>Monthly Savings Report</h1>
              </div>
            </section>
            <div className="grid">
              <Stat title="Current Bill" value={`₹${report.summary.currentBill}`} sub="Before monitoring" />
              <Stat title="Estimated Cost" value={`₹${report.summary.estimatedCost}`} sub="Sample based" />
              <Stat title="Saving" value={`₹${report.summary.saving}`} sub="Estimated" />
              <Stat title="CO₂ Reduced" value={`${report.summary.co2Reduction} kg`} sub="Impact" />
              <Stat title="Payback" value={`${roi.paybackMonths} months`} sub="For ₹3000 device" />
              <Stat title="Yearly Saving" value={`₹${roi.yearlySaving}`} sub="ROI value" />
            </div>
            <section className="panel">
              <h2>Machine Energy Report</h2>
              <table>
                <thead><tr><th>Machine</th><th>Avg Power</th><th>Units</th><th>Readings</th></tr></thead>
                <tbody>
                  {report.rows.map((r) => (
                    <tr key={r.name}>
                      <td>{r.name}</td>
                      <td>{Number(r.avg_power).toFixed(2)} kW</td>
                      <td>{Number(r.units).toFixed(2)} kWh</td>
                      <td>{r.readings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}

        {tab === "assistant" && (
          <section className="panel">
            <h1>WattIntel AI Assistant</h1>
            <div className="chat">
              {chat.map((c, i) => <div className={"bubble " + c.from} key={i}>{c.text}</div>)}
            </div>
            <form className="ask" onSubmit={ask}>
              <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask: Why is my electricity bill high?" />
              <button className="primary">Ask</button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}

function MachineTable({ machines }) {
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            <th>Machine</th><th>Status</th><th>Power</th><th>Voltage</th><th>Current</th><th>PF</th><th>Energy</th>
          </tr>
        </thead>
        <tbody>
          {machines.map((m) => (
            <tr key={m.id}>
              <td><b>{m.name}</b><small>{m.type}</small></td>
              <td><span className={"pill " + (m.live_status || m.status)}>{m.live_status || m.status}</span></td>
              <td>{Number(m.power_kw || 0).toFixed(2)} kW</td>
              <td>{Number(m.voltage || 0).toFixed(0)} V</td>
              <td>{Number(m.current_amp || 0).toFixed(2)} A</td>
              <td>{Number(m.power_factor || 0).toFixed(2)}</td>
              <td>{Number(m.energy_kwh || 0).toFixed(2)} kWh</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
