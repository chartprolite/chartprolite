
import React, { useEffect, useMemo, useState } from "react";

/**
 * ChartPRO Lite — Mock PT EMR (SOAP + Chart Review)
 * Single‑file React app meant for teaching/skills practice.
 * Tailwind CSS required for styling.
 */

const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);

function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}
function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || ""); } catch {
    return fallback;
  }
}

// ----------------------------- Seed Data -----------------------------
const SEED_PATIENTS = [
  {
    id: uid(),
    firstName: "Lili",
    lastName: "Hiswan",
    dob: "2017-02-15",
    sex: "F",
    mrn: "LH-01234",
    allergies: ["NKDA"],
    problems: ["Right wrist pain (2 months)", "Activity intolerance"],
    meds: [],
    vitals: [
      { date: "2025-08-01", hr: 72, rr: 16, bp: "118/74", spO2: 99, notes: "Baseline well" },
      { date: "2025-08-04", hr: 70, rr: 14, bp: "125/80", spO2: 99, notes: "Clinic intake" }
    ],
    notes: [
      {
        id: uid(),
        date: "2025-08-04",
        author: "Ellie H.",
        role: "SPTA",
        visitType: "Evaluation",
        subjective: {
          chiefComplaint: "Pain in right wrist with flexion",
          painLocation: "Right wrist",
          painAtRest: 3,
          painWithMovement: 5,
          painScale: 5,
          other: "Parent states pain x~2 months; episodes severe enough to cry"
        },
        objective: {
          hr: 70, rr: 14, bp: "125/80", spO2: 99,
          posture: "NA",
          observation: "Localized tenderness",
          goniometry: [ { side: "R", joint: "Wrist", motion: "Flexion", degrees: 20, position: "Seated, elbow flexed 90°" } ],
          mmt: [ { muscle: "Wrist flexors", side: "R", grade: 2 } ],
          specialTests: "NA"
        },
        assessment: "Findings consistent with right wrist pain; decreased ROM and strength. PT indicated.",
        plan: {
          interventions: "Gentle AAROM, pain management education, activity modification",
          frequency: "2x/week",
          duration: "4 weeks",
          goals: "Increase wrist flexion to ≥45°, reduce pain to ≤2/10 with ADLs",
          cpt: "97110, 97530",
          education: "Pain scale use; joint protection",
          precautions: "If pain acutely worsens, stop and notify provider"
        },
        signature: { name: "Ellie H.", title: "SPTA", cosignNeeded: true, cosigner: "CI" }
      }
    ]
  },
  {
    id: uid(),
    firstName: "John",
    lastName: "Smith",
    dob: "1959-09-14",
    sex: "M",
    mrn: "JS-00959",
    allergies: ["Penicillin"],
    problems: ["R CVA with L hemiparesis (2024)", "HTN"],
    meds: ["Lisinopril"],
    vitals: [ { date: "2025-07-28", hr: 78, rr: 18, bp: "132/82", spO2: 98, notes: "Baseline" } ],
    notes: []
  }
];

export default function App() {
  const [patients, setPatients] = useState(() => load("cpro_patients", SEED_PATIENTS));
  const [activeId, setActiveId] = useState(patients[0]?.id || null);
  const [tab, setTab] = useState("chart"); // chart | soap | notes | admin
  const [query, setQuery] = useState("");

  useEffect(() => { save("cpro_patients", patients); }, [patients]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(p =>
      [p.firstName, p.lastName, p.mrn].some(x => (x||"").toLowerCase().includes(q))
    );
  }, [patients, query]);

  const active = patients.find(p => p.id === activeId) || filtered[0];

  function addPatient() {
    const p = {
      id: uid(), firstName: "New", lastName: "Patient", dob: "2000-01-01", sex: "U", mrn: `MRN-${Date.now()}`,
      allergies: [], problems: [], meds: [], vitals: [], notes: []
    };
    setPatients(prev => [p, ...prev]);
    setActiveId(p.id);
  }

  function updatePatient(id, patch) {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  }

  function addVital(pId, v) {
    updatePatient(pId, { vitals: [...(patients.find(x=>x.id===pId)?.vitals||[]), v] });
  }

  function addNote(pId, note) {
    updatePatient(pId, { notes: [note, ...(patients.find(x=>x.id===pId)?.notes||[])] });
    setTab("notes");
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(patients, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `chartpro-lite-${new Date().toISOString()}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  function printNote(noteId) {
    const note = active?.notes.find(n=>n.id===noteId);
    if (!note) return;
    const w = window.open("", "print");
    w.document.write(`<html><head><title>SOAP Note - ${active.lastName}, ${active.firstName}</title>
      <style>body{font-family:ui-sans-serif,system-ui,Arial;padding:24px} h1{font-size:20px;margin:0 0 8px} h2{font-size:14px;margin:16px 0 8px} .box{border:1px solid #ddd;padding:12px;border-radius:8px;margin:8px 0} .row{display:flex;gap:12px;flex-wrap:wrap} .cell{flex:1 1 220px}</style>
      </head><body>`);
    w.document.write(`<h1>SOAP Note — ${active.lastName}, ${active.firstName} (MRN: ${active.mrn})</h1>`);
    w.document.write(`<div>Date: ${note.date} | Author: ${note.author} (${note.role}) | Visit: ${note.visitType}</div>`);
    w.document.write(`<h2>Subjective</h2><div class="box">CC: ${note.subjective.chiefComplaint || ""}<br/>Pain Location: ${note.subjective.painLocation || ""}<br/>Pain (rest/move): ${note.subjective.painAtRest||"-"}/10, ${note.subjective.painWithMovement||"-"}/10<br/>Other: ${note.subjective.other||""}</div>`);
    w.document.write(`<h2>Objective</h2><div class="box">Vitals: HR ${note.objective.hr||"-"}, RR ${note.objective.rr||"-"}, BP ${note.objective.bp||"-"}, SpO2 ${note.objective.spO2||"-"}<br/>Observation: ${note.objective.observation||""}<br/>Goniometry:<ul>${(note.objective.goniometry||[]).map(g=>`<li>${g.side} ${g.joint} ${g.motion}: ${g.degrees}° (${g.position||""})</li>`).join("")}</ul>MMT:<ul>${(note.objective.mmt||[]).map(m=>`<li>${m.side} ${m.muscle}: ${m.grade}/5</li>`).join("")}</ul>Special Tests: ${note.objective.specialTests||""}</div>`);
    w.document.write(`<h2>Assessment</h2><div class="box">${note.assessment||""}</div>`);
    w.document.write(`<h2>Plan</h2><div class="box">Interventions: ${note.plan.interventions||""}<br/>Freq/Duration: ${note.plan.frequency||""} x ${note.plan.duration||""}<br/>Goals: ${note.plan.goals||""}<br/>CPT: ${note.plan.cpt||""}<br/>Education: ${note.plan.education||""}<br/>Precautions: ${note.plan.precautions||""}</div>`);
    w.document.write(`<div>Signature: ${note.signature?.name||""}, ${note.signature?.title||""} ${note.signature?.cosignNeeded?"(Co-sign required)":"()"}</div>`);
    w.document.write(`</body></html>`);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="text-xl font-semibold">ChartPRO <span className="text-gray-400">Lite</span></div>
          <div className="ml-auto flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200" onClick={addPatient}>+ New Patient</button>
            <button className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200" onClick={exportJSON}>Export JSON</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-12 gap-4 p-4">
        <aside className="col-span-12 md:col-span-3 bg-white rounded-2xl border shadow-sm p-3">
          <div className="mb-2 font-medium">Patients</div>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name or MRN" className="w-full mb-3 rounded-xl border px-3 py-2" />
          <ul className="space-y-1 max-h-[70vh] overflow-auto pr-1">
            {filtered.map(p => (
              <li key={p.id}>
                <button onClick={()=>{setActiveId(p.id);}} className={`w-full text-left px-3 py-2 rounded-xl hover:bg-gray-50 border ${active?.id===p.id?"border-blue-500 bg-blue-50":"border-transparent"}`}>
                  <div className="font-semibold">{p.lastName}, {p.firstName}</div>
                  <div className="text-xs text-gray-500">MRN {p.mrn} • DOB {p.dob}</div>
                  <div className="text-xs text-gray-500">Problems: {p.problems?.slice(0,2).join(", ")}</div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="col-span-12 md:col-span-9 space-y-4">
          {active && (
            <div className="bg-white rounded-2xl border shadow-sm p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-lg font-semibold">{active.lastName}, {active.firstName}</div>
                <div className="text-sm text-gray-600">MRN {active.mrn} • DOB {active.dob} • Sex {active.sex}</div>
                <div className="ml-auto flex gap-2">
                  <TabButton label="Chart Review" active={tab==="chart"} onClick={()=>setTab("chart")} />
                  <TabButton label="New SOAP" active={tab==="soap"} onClick={()=>setTab("soap")} />
                  <TabButton label="All Notes" active={tab==="notes"} onClick={()=>setTab("notes")} />
                  <TabButton label="Admin" active={tab==="admin"} onClick={()=>setTab("admin")} />
                </div>
              </div>
            </div>
          )}

          {!active && (
            <div className="p-8 text-center text-gray-500">No patient selected.</div>
          )}

          {active && tab === "chart" && (
            <ChartReview patient={active} onAddVital={(v)=>addVital(active.id, v)} onUpdate={(patch)=>updatePatient(active.id, patch)} />
          )}

          {active && tab === "soap" && (
            <SoapComposer key={active.id} patient={active} onSave={(note)=>addNote(active.id, note)} />
          )}

          {active && tab === "notes" && (
            <AllNotes patient={active} onPrint={printNote} />
          )}

          {active && tab === "admin" && (
            <AdminPanel patient={active} onUpdate={(patch)=>updatePatient(active.id, patch)} />
          )}
        </section>
      </main>
    </div>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-xl border ${active?"bg-blue-600 text-white border-blue-600":"bg-gray-100 hover:bg-gray-200"}`}>{label}</button>
  );
}

// ----------------------------- Chart Review -----------------------------
function ChartReview({ patient, onAddVital, onUpdate }) {
  const [vital, setVital] = useState({ date: todayISO(), hr: "", rr: "", bp: "", spO2: "", notes: "" });
  const [newProblem, setNewProblem] = useState("");
  const [newAllergy, setNewAllergy] = useState("");
  const [newMed, setNewMed] = useState("");

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="bg-white rounded-2xl border shadow-sm p-4">
        <div className="font-semibold mb-2">Problems</div>
        <ul className="space-y-1 mb-3">{(patient.problems||[]).map((pr,i)=> (
          <li key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-1.5">
            <span>{pr}</span>
            <button className="text-xs text-gray-500" onClick={()=>onUpdate({ problems: (patient.problems||[]).filter((_,j)=>j!==i) })}>Remove</button>
          </li>
        ))}</ul>
        <div className="flex gap-2">
          <input className="flex-1 rounded-xl border px-3 py-2" placeholder="Add problem" value={newProblem} onChange={e=>setNewProblem(e.target.value)} />
          <button className="px-3 py-2 rounded-xl bg-gray-100" onClick={()=>{ if(newProblem.trim()){ onUpdate({ problems:[...(patient.problems||[]), newProblem.trim()]}); setNewProblem(""); }}}>Add</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-4">
        <div className="font-semibold mb-2">Allergies & Meds</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-sm text-gray-600 mb-1">Allergies</div>
            <ul className="space-y-1 mb-2">{(patient.allergies||[]).map((a,i)=> (
              <li key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-1.5">
                <span>{a}</span>
                <button className="text-xs text-gray-500" onClick={()=>onUpdate({ allergies: (patient.allergies||[]).filter((_,j)=>j!==i) })}>Remove</button>
              </li>
            ))}</ul>
            <div className="flex gap-2">
              <input className="flex-1 rounded-xl border px-3 py-2" placeholder="Add allergy" value={newAllergy} onChange={e=>setNewAllergy(e.target.value)} />
              <button className="px-3 py-2 rounded-xl bg-gray-100" onClick={()=>{ if(newAllergy.trim()){ onUpdate({ allergies:[...(patient.allergies||[]), newAllergy.trim()]}); setNewAllergy(""); }}}>Add</button>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Medications</div>
            <ul className="space-y-1 mb-2">{(patient.meds||[]).map((m,i)=> (
              <li key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-1.5">
                <span>{m}</span>
                <button className="text-xs text-gray-500" onClick={()=>onUpdate({ meds: (patient.meds||[]).filter((_,j)=>j!==i) })}>Remove</button>
              </li>
            ))}</ul>
            <div className="flex gap-2">
              <input className="flex-1 rounded-xl border px-3 py-2" placeholder="Add medication" value={newMed} onChange={e=>setNewMed(e.target.value)} />
              <button className="px-3 py-2 rounded-xl bg-gray-100" onClick={()=>{ if(newMed.trim()){ onUpdate({ meds:[...(patient.meds||[]), newMed.trim()]}); setNewMed(""); }}}>Add</button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-4">
        <div className="font-semibold mb-2">Vitals Timeline</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-1">Date</th><th>HR</th><th>RR</th><th>BP</th><th>SpO₂</th><th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {(patient.vitals||[]).map((v,i)=> (
              <tr key={i} className="border-t">
                <td className="py-1">{v.date}</td>
                <td>{v.hr}</td><td>{v.rr}</td><td>{v.bp}</td><td>{v.spO2}</td><td className="text-gray-600">{v.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 grid grid-cols-6 gap-2 items-end">
          <input className="col-span-2 rounded-xl border px-3 py-2" type="date" value={vital.date} onChange={e=>setVital({...vital, date:e.target.value})} />
          <input className="rounded-xl border px-3 py-2" placeholder="HR" value={vital.hr} onChange={e=>setVital({...vital, hr:e.target.value})} />
          <input className="rounded-xl border px-3 py-2" placeholder="RR" value={vital.rr} onChange={e=>setVital({...vital, rr:e.target.value})} />
          <input className="rounded-xl border px-3 py-2" placeholder="BP" value={vital.bp} onChange={e=>setVital({...vital, bp:e.target.value})} />
          <input className="rounded-xl border px-3 py-2" placeholder="SpO2" value={vital.spO2} onChange={e=>setVital({...vital, spO2:e.target.value})} />
          <button className="rounded-xl bg-gray-100 px-3 py-2" onClick={()=>{ onAddVital(vital); setVital({ date: todayISO(), hr: "", rr: "", bp: "", spO2: "", notes: "" }); }}>Add</button>
        </div>
        <input className="mt-2 w-full rounded-xl border px-3 py-2" placeholder="Notes (optional)" value={vital.notes} onChange={e=>setVital({...vital, notes:e.target.value})} />
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-4">
        <div className="font-semibold mb-2">Demographics</div>
        <div className="grid grid-cols-2 gap-2">
          <LabeledInput label="First name" value={patient.firstName} onChange={v=>onUpdate({ firstName:v })} />
          <LabeledInput label="Last name" value={patient.lastName} onChange={v=>onUpdate({ lastName:v })} />
          <LabeledInput label="DOB" type="date" value={patient.dob} onChange={v=>onUpdate({ dob:v })} />
          <LabeledInput label="Sex" value={patient.sex} onChange={v=>onUpdate({ sex:v })} />
          <LabeledInput label="MRN" value={patient.mrn} onChange={v=>onUpdate({ mrn:v })} />
        </div>
      </div>
    </div>
  );
}

function LabeledInput({ label, value, onChange, type="text" }) {
  return (
    <label className="text-sm">
      <div className="text-gray-600 mb-1">{label}</div>
      <input type={type} className="w-full rounded-xl border px-3 py-2" value={value||""} onChange={e=>onChange(e.target.value)} />
    </label>
  );
}

// ----------------------------- SOAP Composer -----------------------------
function SoapComposer({ patient, onSave }) {
  const [note, setNote] = useState(() => ({
    id: uid(),
    date: todayISO(),
    author: "Student PTA",
    role: "SPTA",
    visitType: "Treatment",
    subjective: { chiefComplaint: "", painLocation: "", painAtRest: "", painWithMovement: "", painScale: "", other: "" },
    objective: { hr: "", rr: "", bp: "", spO2: "", posture: "", observation: "", goniometry: [], mmt: [], specialTests: "" },
    assessment: "",
    plan: { interventions: "", frequency: "", duration: "", goals: "", cpt: "", education: "", precautions: "" },
    signature: { name: "Student PTA", title: "SPTA", cosignNeeded: true, cosigner: "CI" }
  }));

  const [goniRow, setGoniRow] = useState({ side: "R", joint: "Wrist", motion: "Flexion", degrees: "", position: "Seated" });
  const [mmtRow, setMmtRow] = useState({ muscle: "Wrist flexors", side: "R", grade: "" });

  function addGoniRow() {
    if (!goniRow.degrees) return;
    setNote(n => ({ ...n, objective: { ...n.objective, goniometry: [...n.objective.goniometry, { ...goniRow, degrees: Number(goniRow.degrees) }] }}));
    setGoniRow({ ...goniRow, degrees: "" });
  }

  function addMmtRow() {
    if (!mmtRow.grade) return;
    setNote(n => ({ ...n, objective: { ...n.objective, mmt: [...n.objective.mmt, { ...mmtRow, grade: Number(mmtRow.grade) }] }}));
    setMmtRow({ ...mmtRow, grade: "" });
  }

  const requiredOk = note.date && note.author && note.subjective.chiefComplaint && note.assessment && note.plan.interventions;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border shadow-sm p-4 grid md:grid-cols-4 gap-3">
        <LabeledInput label="Date" type="date" value={note.date} onChange={v=>setNote({...note, date:v})} />
        <LabeledInput label="Author" value={note.author} onChange={v=>setNote({...note, author:v})} />
        <LabeledInput label="Role" value={note.role} onChange={v=>setNote({...note, role:v})} />
        <label className="text-sm">
          <div className="text-gray-600 mb-1">Visit Type</div>
          <select className="w-full rounded-xl border px-3 py-2" value={note.visitType} onChange={e=>setNote({...note, visitType:e.target.value})}>
            {"Evaluation,Re-Eval,Treatment,Discharge".split(",").map(v=> <option key={v}>{v}</option>)}
          </select>
        </label>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-4">
        <div className="font-semibold mb-2">Subjective</div>
        <div className="grid md:grid-cols-3 gap-3">
          <LabeledInput label="Chief Complaint" value={note.subjective.chiefComplaint} onChange={v=>setNote({...note, subjective:{...note.subjective, chiefComplaint:v}})} />
          <LabeledInput label="Pain Location" value={note.subjective.painLocation} onChange={v=>setNote({...note, subjective:{...note.subjective, painLocation:v}})} />
          <LabeledInput label="Pain (0-10) at Rest" value={note.subjective.painAtRest} onChange={v=>setNote({...note, subjective:{...note.subjective, painAtRest:v}})} />
          <LabeledInput label="Pain (0-10) with Movement" value={note.subjective.painWithMovement} onChange={v=>setNote({...note, subjective:{...note.subjective, painWithMovement:v}})} />
          <LabeledInput label="Overall Pain (0-10)" value={note.subjective.painScale} onChange={v=>setNote({...note, subjective:{...note.subjective, painScale:v}})} />
          <LabeledInput label="Other/Parent Report" value={note.subjective.other} onChange={v=>setNote({...note, subjective:{...note.subjective, other:v}})} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-3">
        <div className="font-semibold">Objective</div>
        <div className="grid md:grid-cols-4 gap-3">
          <LabeledInput label="HR" value={note.objective.hr} onChange={v=>setNote({...note, objective:{...note.objective, hr:v}})} />
          <LabeledInput label="RR" value={note.objective.rr} onChange={v=>setNote({...note, objective:{...note.objective, rr:v}})} />
          <LabeledInput label="BP" value={note.objective.bp} onChange={v=>setNote({...note, objective:{...note.objective, bp:v}})} />
          <LabeledInput label="SpO2" value={note.objective.spO2} onChange={v=>setNote({...note, objective:{...note.objective, spO2:v}})} />
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <LabeledInput label="Observation/Posture" value={note.objective.observation} onChange={v=>setNote({...note, objective:{...note.objective, observation:v}})} />
          <LabeledInput label="Special Tests" value={note.objective.specialTests} onChange={v=>setNote({...note, objective:{...note.objective, specialTests:v}})} />
        </div>

        <div className="border rounded-2xl p-3">
          <div className="font-medium mb-2">Goniometry</div>
          <table className="w-full text-sm mb-2">
            <thead>
              <tr className="text-left text-gray-600"><th>Side</th><th>Joint</th><th>Motion</th><th>Degrees</th><th>Position</th></tr>
            </thead>
            <tbody>
              {note.objective.goniometry.map((g,i)=> (
                <tr key={i} className="border-t"><td>{g.side}</td><td>{g.joint}</td><td>{g.motion}</td><td>{g.degrees}°</td><td>{g.position}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="grid md:grid-cols-5 gap-2 items-end">
            <Select label="Side" value={goniRow.side} onChange={v=>setGoniRow({...goniRow, side:v})} options={["R","L"]} />
            <LabeledInput label="Joint" value={goniRow.joint} onChange={v=>setGoniRow({...goniRow, joint:v})} />
            <LabeledInput label="Motion" value={goniRow.motion} onChange={v=>setGoniRow({...goniRow, motion:v})} />
            <LabeledInput label="Degrees" value={goniRow.degrees} onChange={v=>setGoniRow({...goniRow, degrees:v})} />
            <LabeledInput label="Position" value={goniRow.position} onChange={v=>setGoniRow({...goniRow, position:v})} />
          </div>
          <div className="mt-2"><button className="px-3 py-2 rounded-xl bg-gray-100" onClick={addGoniRow}>Add Goni</button></div>
        </div>

        <div className="border rounded-2xl p-3">
          <div className="font-medium mb-2">MMT</div>
          <table className="w-full text-sm mb-2">
            <thead>
              <tr className="text-left text-gray-600"><th>Muscle</th><th>Side</th><th>Grade (0-5)</th></tr>
            </thead>
            <tbody>
              {note.objective.mmt.map((m,i)=> (
                <tr key={i} className="border-t"><td>{m.muscle}</td><td>{m.side}</td><td>{m.grade}/5</td></tr>
              ))}
            </tbody>
          </table>
          <div className="grid md:grid-cols-3 gap-2 items-end">
            <LabeledInput label="Muscle" value={mmtRow.muscle} onChange={v=>setMmtRow({...mmtRow, muscle:v})} />
            <Select label="Side" value={mmtRow.side} onChange={v=>setMmtRow({...mmtRow, side:v})} options={["R","L"]} />
            <Select label="Grade" value={mmtRow.grade} onChange={v=>setMmtRow({...mmtRow, grade:v})} options={["0","1","2","3","4","5"]} />
          </div>
          <div className="mt-2"><button className="px-3 py-2 rounded-xl bg-gray-100" onClick={addMmtRow}>Add MMT</button></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-4">
        <div className="font-semibold mb-2">Assessment</div>
        <textarea className="w-full rounded-xl border px-3 py-2 min-h-[100px]" value={note.assessment} onChange={e=>setNote({...note, assessment:e.target.value})} placeholder="Synthesis of findings, clinical rationale, impairment list, rehab potential" />
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-4">
        <div className="font-semibold mb-2">Plan</div>
        <div className="grid md:grid-cols-2 gap-3">
          <LabeledInput label="Interventions (97110, 97530, etc.)" value={note.plan.interventions} onChange={v=>setNote({...note, plan:{...note.plan, interventions:v}})} />
          <LabeledInput label="Education" value={note.plan.education} onChange={v=>setNote({...note, plan:{...note.plan, education:v}})} />
          <LabeledInput label="Frequency" value={note.plan.frequency} onChange={v=>setNote({...note, plan:{...note.plan, frequency:v}})} />
          <LabeledInput label="Duration" value={note.plan.duration} onChange={v=>setNote({...note, plan:{...note.plan, duration:v}})} />
          <LabeledInput label="Goals" value={note.plan.goals} onChange={v=>setNote({...note, plan:{...note.plan, goals:v}})} />
          <LabeledInput label="Precautions" value={note.plan.precautions} onChange={v=>setNote({...note, plan:{...note.plan, precautions:v}})} />
          <LabeledInput label="CPT Codes" value={note.plan.cpt} onChange={v=>setNote({...note, plan:{...note.plan, cpt:v}})} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-4 grid md:grid-cols-4 gap-3">
        <LabeledInput label="Signer Name" value={note.signature.name} onChange={v=>setNote({...note, signature:{...note.signature, name:v}})} />
        <LabeledInput label="Title" value={note.signature.title} onChange={v=>setNote({...note, signature:{...note.signature, title:v}})} />
        <label className="text-sm flex items-center gap-2 mt-6"><input type="checkbox" checked={note.signature.cosignNeeded} onChange={e=>setNote({...note, signature:{...note.signature, cosignNeeded:e.target.checked}})} /> Co‑sign required</label>
        <LabeledInput label="Co‑signer" value={note.signature.cosigner} onChange={v=>setNote({...note, signature:{...note.signature, cosigner:v}})} />
      </div>

      <div className="flex items-center gap-2">
        <button disabled={!requiredOk} className={`px-4 py-2 rounded-xl ${requiredOk?"bg-blue-600 text-white":"bg-gray-200 text-gray-500"}`} onClick={()=>onSave(note)}>Save Note</button>
        {!requiredOk && <div className="text-sm text-gray-600">Required: Date, Author, Chief Complaint, Assessment, Interventions</div>}
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="text-sm">
      <div className="text-gray-600 mb-1">{label}</div>
      <select className="w-full rounded-xl border px-3 py-2" value={value} onChange={e=>onChange(e.target.value)}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

// ----------------------------- All Notes -----------------------------
function AllNotes({ patient, onPrint }) {
  const [filter, setFilter] = useState("");
  const notes = (patient.notes||[]).filter(n => {
    if (!filter) return true;
    return [n.subjective?.chiefComplaint, n.assessment, n.plan?.interventions].join(" ").toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="font-semibold">All Notes ({patient.lastName}, {patient.firstName})</div>
        <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter notes" className="ml-auto rounded-xl border px-3 py-2" />
      </div>
      <ul className="divide-y">
        {notes.map(n => (
          <li key={n.id} className="py-3">
            <div className="flex items-center gap-2">
              <div className="font-medium">{n.date} • {n.visitType}</div>
              <div className="text-sm text-gray-600">by {n.author} ({n.role})</div>
              <button className="ml-auto px-3 py-1.5 rounded-xl bg-gray-100" onClick={()=>onPrint(n.id)}>Print</button>
            </div>
            <div className="text-sm text-gray-700"><span className="font-semibold">CC:</span> {n.subjective?.chiefComplaint}</div>
            <div className="text-sm text-gray-700"><span className="font-semibold">Assessment:</span> {n.assessment}</div>
            <div className="text-sm text-gray-700"><span className="font-semibold">Plan:</span> {n.plan?.interventions}</div>
          </li>
        ))}
        {notes.length === 0 && (
          <li className="py-6 text-center text-gray-500">No notes found.</li>
        )}
      </ul>
    </div>
  );
}

// ----------------------------- Admin Panel -----------------------------
function AdminPanel({ patient, onUpdate }) {
  const [icd, setIcd] = useState("");
  const [cptFav, setCptFav] = useState("");
  const [tags, setTags] = useState(load("cpro_tags", { icd: [], cpt: [] }));
  useEffect(()=>save("cpro_tags", tags), [tags]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="bg-white rounded-2xl border shadow-sm p-4">
        <div className="font-semibold mb-2">ICD‑10 (patient‑level)</div>
        <ul className="flex flex-wrap gap-2 mb-2">{(patient.icd10||[]).map((code,i)=> (
          <li key={i} className="px-2 py-1 bg-gray-100 rounded-xl text-sm">{code} <button className="ml-1 text-xs text-gray-500" onClick={()=>onUpdate({ icd10: (patient.icd10||[]).filter((_,j)=>j!==i) })}>×</button></li>
        ))}</ul>
        <div className="flex gap-2">
          <input className="flex-1 rounded-xl border px-3 py-2" placeholder="e.g., M25.531 (Right wrist pain)" value={icd} onChange={e=>setIcd(e.target.value)} />
          <button className="px-3 py-2 rounded-xl bg-gray-100" onClick={()=>{ if(icd.trim()){ onUpdate({ icd10:[...(patient.icd10||[]), icd.trim()]}); setIcd(""); }}}>Add</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-4">
        <div className="font-semibold mb-2">Favorite CPT Codes (global)</div>
        <ul className="flex flex-wrap gap-2 mb-2">{(tags.cpt||[]).map((code,i)=> (
          <li key={i} className="px-2 py-1 bg-gray-100 rounded-xl text-sm">{code} <button className="ml-1 text-xs text-gray-500" onClick={()=>setTags({ ...tags, cpt: (tags.cpt||[]).filter((_,j)=>j!==i) })}>×</button></li>
        ))}</ul>
        <div className="flex gap-2">
          <input className="flex-1 rounded-xl border px-3 py-2" placeholder="e.g., 97110, 97140" value={cptFav} onChange={e=>setCptFav(e.target.value)} />
          <button className="px-3 py-2 rounded-xl bg-gray-100" onClick={()=>{ if(cptFav.trim()){ setTags({ ...tags, cpt:[...(tags.cpt||[]), cptFav.trim()]}); setCptFav(""); }}}>Add</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-4 md:col-span-2">
        <div className="font-semibold mb-2">Clinical Flags</div>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>Red flags auto‑check: BP systolic &gt; 180 or diastolic &gt; 110, HR &lt; 50 or &gt; 120, SpO₂ &lt; 92%. (Manually review in vitals timeline.)</li>
          <li>Co‑sign tracking for students is visible on saved notes.</li>
          <li>Use Print to generate a clean, chart‑ready SOAP printout for grading/simulation.</li>
        </ul>
      </div>
    </div>
  );
}
