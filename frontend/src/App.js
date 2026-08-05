import React, { useState, useEffect, useCallback } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const API = '/api';

const C = {
  bg:'#0d1117', bgDeep:'#080c10', surface:'#161b22', surface2:'#1c2430', surface3:'#21293a',
  border:'#2a3444', teal:'#00d2c8', tealDim:'rgba(0,210,200,0.12)', amber:'#f59e0b',
  amberDim:'rgba(245,158,11,0.12)', green:'#22c55e', greenDim:'rgba(34,197,94,0.12)',
  red:'#f43f5e', redDim:'rgba(244,63,94,0.12)', text:'#e2e8f0', textMid:'#94a3b8', textDim:'#475569',
  mono:"'JetBrains Mono','Fira Code','Courier New',monospace",
  sans:"'Sora','Plus Jakarta Sans',system-ui,sans-serif",
  display:"'Bebas Neue',impact,sans-serif",
};
const glow = (c,s=12) => `0 0 ${s}px ${c}`;

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
      body{background:${C.bg};color:${C.text};font-family:${C.sans};overflow-x:hidden}
      ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${C.bgDeep}}
      ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
      ::-webkit-scrollbar-thumb:hover{background:${C.teal}}
      input[type=number]{-moz-appearance:textfield}
      input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
      .finp-num{background:${C.bgDeep};border:1px solid ${C.border};color:${C.text};padding:9px 12px;border-radius:8px;font-size:14px;font-weight:700;font-family:${C.mono};width:100%;transition:border-color 0.18s,box-shadow 0.18s;outline:none;text-align:right}
      .finp-num:focus{border-color:${C.teal};box-shadow:${glow(C.teal,6)}}
      .finp-num::placeholder{color:${C.textDim};font-weight:400;font-size:12px;text-align:left}
      .finp-num.err{border-color:${C.red};box-shadow:${glow(C.red,4)}}
      select option{background:${C.surface2};color:${C.text}}
      @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(0,210,200,0.4)}70%{box-shadow:0 0 0 10px rgba(0,210,200,0)}100%{box-shadow:0 0 0 0 rgba(0,210,200,0)}}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
      @keyframes slideRight{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
      .anim{animation:fadeUp 0.4s ease both}
      .anim1{animation:fadeUp 0.4s 0.07s ease both}
      .anim2{animation:fadeUp 0.4s 0.14s ease both}
      .anim3{animation:fadeUp 0.4s 0.21s ease both}
      .ch{transition:transform 0.2s,box-shadow 0.2s,border-color 0.2s}
      .ch:hover{transform:translateY(-2px);border-color:${C.teal}!important;box-shadow:0 8px 32px rgba(0,0,0,0.4),${glow(C.teal,6)}}
      .nav-btn{display:flex;align-items:center;gap:10px;padding:11px 16px;border:none;background:transparent;color:${C.textMid};cursor:pointer;font-family:${C.sans};font-size:13px;font-weight:500;border-left:2px solid transparent;border-radius:0 6px 6px 0;transition:all 0.18s;width:100%;text-align:left;letter-spacing:0.02em}
      .nav-btn:hover{background:${C.surface2};color:${C.text}}
      .nav-btn.active{background:${C.tealDim};color:${C.teal};border-left-color:${C.teal};box-shadow:inset ${glow(C.teal,4)}}
      .btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:8px;font-family:${C.sans};font-size:13px;font-weight:600;cursor:pointer;border:none;transition:all 0.18s;letter-spacing:0.03em}
      .bt{background:${C.teal};color:#000;box-shadow:${glow(C.teal,8)}}
      .bt:hover{filter:brightness(1.15);transform:translateY(-1px);box-shadow:${glow(C.teal,14)}}
      .bt:disabled{opacity:0.5;cursor:not-allowed;transform:none}
      .bg{background:transparent;color:${C.textMid};border:1px solid ${C.border}}
      .bg:hover{background:${C.surface2};color:${C.text};border-color:${C.textMid}}
      .bd{background:${C.redDim};color:${C.red};border:1px solid rgba(244,63,94,0.3)}
      .bd:hover{background:rgba(244,63,94,0.22);box-shadow:${glow(C.red,6)}}
      .badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase}
      .badge::before{content:'';width:5px;height:5px;border-radius:50%;display:inline-block}
      .bg2{background:${C.greenDim};color:${C.green};border:1px solid rgba(34,197,94,0.25)}
      .bg2::before{background:${C.green};box-shadow:${glow(C.green,4)}}
      .ba{background:${C.amberDim};color:${C.amber};border:1px solid rgba(245,158,11,0.25)}
      .ba::before{background:${C.amber};animation:blink 2s infinite}
      .br2{background:${C.redDim};color:${C.red};border:1px solid rgba(244,63,94,0.25)}
      .br2::before{background:${C.red};animation:blink 1s infinite}
      .bt2{background:${C.tealDim};color:${C.teal};border:1px solid rgba(0,210,200,0.25)}
      .bt2::before{background:${C.teal}}
      .fi{display:flex;flex-direction:column;gap:6px}
      .fl{font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${C.textMid};font-weight:600}
      .finp,.fsel{background:${C.bgDeep};border:1px solid ${C.border};color:${C.text};padding:10px 14px;border-radius:8px;font-size:13px;font-family:${C.sans};width:100%;transition:border-color 0.18s,box-shadow 0.18s;outline:none}
      .finp:focus,.fsel:focus{border-color:${C.teal};box-shadow:${glow(C.teal,4)}}
      .finp::placeholder{color:${C.textDim}}
      .dt{width:100%;border-collapse:collapse}
      .dt th{text-align:left;padding:10px 16px;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:${C.textDim};border-bottom:1px solid ${C.border};font-family:${C.mono};font-weight:500;white-space:nowrap}
      .dt td{padding:13px 16px;border-bottom:1px solid rgba(42,52,68,0.5);font-size:13px;vertical-align:middle}
      .dt tbody tr{transition:background 0.15s}
      .dt tbody tr:hover td{background:${C.surface2}}
      .dt tbody tr:last-child td{border-bottom:none}
      .ov{position:fixed;inset:0;background:rgba(8,12,16,0.85);display:flex;align-items:center;justify-content:center;z-index:200;backdrop-filter:blur(6px);animation:fadeUp 0.2s ease}
      .mo{background:${C.surface};border:1px solid ${C.border};border-radius:14px;padding:28px;width:580px;max-width:96vw;max-height:92vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.6),${glow(C.teal,3)};animation:slideRight 0.25s ease}
      .ep{display:inline-flex;align-items:center;background:rgba(244,63,94,0.12);color:${C.red};border:1px solid rgba(244,63,94,0.3);font-size:9px;font-weight:800;letter-spacing:0.1em;padding:1px 7px;border-radius:4px;margin-left:7px;text-transform:uppercase;vertical-align:middle}
      .tst{position:fixed;bottom:28px;right:28px;background:${C.surface2};border-radius:10px;padding:13px 20px;font-size:13px;font-weight:500;z-index:999;max-width:340px;animation:slideRight 0.25s ease;box-shadow:0 8px 32px rgba(0,0,0,0.5);display:flex;align-items:center;gap:10px}
      .ts{border-left:3px solid ${C.green};color:${C.green}}
      .te{border-left:3px solid ${C.red};color:${C.red}}
      .ti{border-left:3px solid ${C.teal};color:${C.teal}}
      .en{background:linear-gradient(135deg,rgba(244,63,94,0.06),rgba(244,63,94,0.02));border:1px solid rgba(244,63,94,0.2);border-left:3px solid ${C.red};border-radius:8px;padding:12px 16px;font-size:12px;color:#fca5a5;line-height:1.7;margin-bottom:18px}
      .en strong{color:${C.red}}
      .ld{width:7px;height:7px;border-radius:50%;background:${C.green};box-shadow:${glow(C.green,6)};animation:pulse 2s infinite;display:inline-block}
      .st{font-family:${C.mono};font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:${C.textDim};margin-bottom:14px;display:flex;align-items:center;gap:8px}
      .st::after{content:'';flex:1;height:1px;background:${C.border}}
    `}</style>
  );
}

/* SVG Icon system */
const Ic = ({ d, size=16, color, fill='none', sw=2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={color||'currentColor'} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{flexShrink:0}}>
    {typeof d === 'string' ? <path d={d}/> : d}
  </svg>
);

const IcDash  = () => <Ic d={<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>}/>;
const IcMach  = () => <Ic d={<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></>}/>;
const IcBrain = () => <Ic d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2Z"/>;
const IcCal  = () => <Ic d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}/>;
const IcPlus = () => <Ic d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>}/>;
const IcEdit = (p) => <Ic size={14} d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></>} {...p}/>;
const IcTrsh = (p) => <Ic size={14} d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>} {...p}/>;
const IcX    = () => <Ic size={15} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>;
const IcAlrt = () => <Ic d={<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}/>;
const IcRef  = () => <Ic d={<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>}/>;
const IcInfo = () => <Ic size={13} d={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>}/>;

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3800); return () => clearTimeout(t); }, [onClose]);
  return <div className={`tst t${type[0]}`}>{type==='success'?'✓':type==='error'?'✕':'ℹ'} {message}</div>;
}

function StatusBadge({ status }) {
  const map = { Healthy:'bg2', Moderate:'ba', Critical:'br2', Unknown:'bt2' };
  return <span className={`badge ${map[status]||'bt2'}`}>{status||'—'}</span>;
}
function PriorityBadge({ priority }) {
  const map = { Low:'bg2', Medium:'bt2', High:'ba', Critical:'br2' };
  return <span className={`badge ${map[priority]||'bt2'}`}>{priority||'—'}</span>;
}

function RiskBar({ score }) {
  const s = parseFloat(score)||0;
  const col = s>=70?C.red:s>=40?C.amber:C.green;
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:5,fontFamily:C.mono}}>
        <span style={{color:C.textDim}}>RISK</span>
        <span style={{color:col,fontWeight:700}}>{s.toFixed(1)}%</span>
      </div>
      <div style={{height:4,background:C.border,borderRadius:2,overflow:'hidden'}}>
        <div style={{height:'100%',width:`${s}%`,borderRadius:2,background:`linear-gradient(90deg,${col}99,${col})`,boxShadow:glow(col,4),transition:'width 0.6s cubic-bezier(.4,0,.2,1)'}}/>
      </div>
    </div>
  );
}

// ─── Machine types that support tool_condition ────────────────────────────────
const CNC_TYPES = ['CNC Machine','CNC Lathe','Milling','Lathe','Grinder','Drill Press'];
const isCNC = (type) => CNC_TYPES.includes(type);

// ─── Machine Form Modal ───────────────────────────────────────────────────────
// FIX: tool_condition is EXCEPTION (only CNC), NOT operational_hours
// FIX: operational_hours is a required active parameter (20% weight)
const DEF = {
  name:'', type:'CNC Machine', location:'Bay A',
  temperature:45, vibration:1.5, power_usage:10,
  tool_condition:80, operational_hours:500,
};

function MachineModal({ machine, onSave, onClose }) {
  const [form, setForm] = useState(machine ? {
    name:              machine.name,
    type:              machine.type || 'CNC Machine',
    location:          machine.location || 'Bay A',
    temperature:       parseFloat(machine.temperature)       || 45,
    vibration:         parseFloat(machine.vibration)         || 1.5,
    power_usage:       parseFloat(machine.power_usage)       || 10,
    tool_condition:    machine.tool_condition != null ? parseFloat(machine.tool_condition) : '',
    operational_hours: parseFloat(machine.operational_hours) || 0,
  } : {...DEF});
  const [busy, setBusy] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  // When machine type changes, clear tool_condition if switching to non-CNC
  const setType = (v) => {
    setForm(f => ({
      ...f,
      type: v,
      tool_condition: isCNC(v) ? (f.tool_condition === '' ? 80 : f.tool_condition) : '',
    }));
  };

  const submit = async () => {
    if (!form.name.trim()) return alert('Machine name is required');
    setBusy(true);
    try {
      // FIX: send null for tool_condition when empty (non-CNC machines)
      const payload = {
        ...form,
        tool_condition: (form.tool_condition !== '' && form.tool_condition !== null)
          ? parseFloat(form.tool_condition)
          : null,
      };
      const res = await fetch(machine ? `${API}/machines/${machine.id}` : `${API}/machines`, {
        method:  machine ? 'PUT' : 'POST',
        headers: {'Content-Type':'application/json'},
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) onSave(data); else alert(data.message);
    } catch(e) { alert('Connection error: ' + e.message); }
    setBusy(false);
  };

  const NumInput = ({label, field, min, max, step=1, unit, placeholder, col=C.teal}) => {
    const v = form[field];
    const num = parseFloat(v);
    const isErr = v !== '' && v !== null && v !== undefined && (!isNaN(num)) && (num < min || num > max);
    return (
      <div className="fi">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
          <label className="fl">{label}</label>
          <span style={{fontFamily:C.mono,fontSize:9,color:C.textDim,letterSpacing:'0.06em'}}>
            {min}–{max} {unit}
          </span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:0,position:'relative'}}>
          <input
            type="number"
            className={`finp-num${isErr?' err':''}`}
            style={{
              borderRadius:'8px 0 0 8px',
              borderRight:'none',
              color: isErr ? C.red : col,
              flex:1,
            }}
            min={min} max={max} step={step}
            value={v ?? ''}
            placeholder={placeholder}
            onChange={e => {
              const raw = e.target.value;
              set(field, raw === '' ? '' : parseFloat(raw));
            }}
          />
          <span style={{
            background:C.surface3, border:`1px solid ${isErr?C.red:C.border}`,
            borderLeft:'none', borderRadius:'0 8px 8px 0',
            padding:'9px 11px', fontFamily:C.mono, fontSize:11,
            fontWeight:600, color: isErr ? C.red : C.textMid,
            whiteSpace:'nowrap', lineHeight:'1',
            transition:'border-color 0.18s, color 0.18s',
            display:'flex', alignItems:'center',
          }}>
            {unit}
          </span>
        </div>
        {isErr && (
          <span style={{fontSize:10,color:C.red,fontFamily:C.mono,letterSpacing:'0.04em'}}>
            ✕ value must be {min}–{max}
          </span>
        )}
      </div>
    );
  };

  const hasTool = isCNC(form.type);

  return (
    <div className="ov">
      <div className="mo">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22}}>
          <div>
            <h3 style={{fontFamily:C.mono,fontSize:15,color:C.teal,letterSpacing:'0.05em'}}>
              {machine ? '// EDIT MACHINE' : '// NEW MACHINE'}
            </h3>
            <p style={{fontSize:12,color:C.textDim,marginTop:3}}>
              {machine ? 'Update parameters — AI prediction will re-run' : 'Prediction generates automatically on save'}
            </p>
          </div>
          <button className="btn bg" style={{padding:'6px 10px'}} onClick={onClose}><IcX/></button>
        </div>

        {/* FIX: correct EXCEPTION note — Tool Condition, not Operational Hours */}
        <div className="en">
          <strong>⚠ Parameter Note —</strong> <strong>Tool Condition</strong> is an
          <strong> EXCEPTION</strong>: only applicable to CNC/cutting machines.
          For general equipment (compressors, presses, motors) it is set to <strong>NULL</strong> and
          <strong> excluded from prediction</strong>. All other 4 parameters are active inputs.
          {hasTool
            ? <span style={{color:C.green,display:'block',marginTop:4}}>✓ CNC type selected — Tool Condition is active (±15% adjustment)</span>
            : <span style={{color:C.red,display:'block',marginTop:4}}>✕ Non-CNC type — Tool Condition is excluded (NULL)</span>
          }
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
          <div className="fi" style={{gridColumn:'1/-1'}}>
            <label className="fl">Machine Name *</label>
            <input className="finp" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. CNC Lathe Machine #1"/>
          </div>
          <div className="fi">
            <label className="fl">Machine Type</label>
            <select className="fsel" value={form.type} onChange={e=>setType(e.target.value)}>
              {['CNC Machine','CNC Lathe','Milling','Lathe','Grinder','Drill Press','Hydraulic Press','Welding','Conveyor','Compressor','General Equipment'].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="fi">
            <label className="fl">Location</label>
            <input className="finp" value={form.location} onChange={e=>set('location',e.target.value)} placeholder="e.g. Bay A"/>
          </div>
        </div>

        {/* FIX: All four are ACTIVE parameters — correct weights shown */}
        <div className="st">Active AI Parameters — 4 Features (100% weight)</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
          <NumInput label="Vibration (35%)"        field="vibration"         min={0}  max={20}    step={0.1} unit="mm/s" placeholder="0.0 – 20.0"   col={C.amber}/>
          <NumInput label="Temperature (25%)"       field="temperature"       min={0}  max={150}   step={0.1} unit="°C"   placeholder="0.0 – 150.0"  col={C.red}/>
          <NumInput label="Power Usage (20%)"       field="power_usage"       min={0}  max={100}   step={0.1} unit="kW"   placeholder="0.0 – 100.0"  col={C.teal}/>
          <NumInput label="Operational Hours (20%)" field="operational_hours" min={0}  max={10000} step={1}   unit="hrs"  placeholder="0 – 10000"    col={C.green}/>
        </div>

        {/* FIX: Tool Condition is the EXCEPTION — shown separately, disabled for non-CNC */}
        <div className="st" style={{color: hasTool ? 'rgba(0,210,200,0.5)' : 'rgba(244,63,94,0.45)'}}>
          Exception — Tool Condition {hasTool ? '(±15% Adjustment — CNC Active)' : '(NULL — Non-CNC Excluded)'}
        </div>
        {hasTool ? (
          <NumInput label="Tool Condition" field="tool_condition" min={0} max={100} step={1} unit="%" placeholder="0 – 100" col={C.green}/>
        ) : (
          <div style={{background:'rgba(244,63,94,0.06)',border:'1px dashed rgba(244,63,94,0.3)',borderRadius:8,padding:'14px 16px',fontSize:12,color:C.textDim,display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:18}}>⚠</span>
            <span>Tool Condition is <strong style={{color:C.red}}>NULL</strong> for <strong>{form.type}</strong> — not applicable. Select a CNC/cutting machine type to enable this field.</span>
          </div>
        )}

        <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:26}}>
          <button className="btn bg" onClick={onClose}>Cancel</button>
          <button className="btn bt" onClick={submit} disabled={busy}>
            {busy ? 'Processing…' : machine ? 'Update & Re-predict' : '+ Add Machine'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirm({ machine, onConfirm, onClose }) {
  return (
    <div className="ov">
      <div className="mo" style={{width:380,textAlign:'center'}}>
        <div style={{width:56,height:56,borderRadius:'50%',background:C.redDim,border:'1px solid rgba(244,63,94,0.3)',display:'flex',alignItems:'center',justifyContent:'center',margin:'10px auto 16px',color:C.red,fontSize:22}}>⚠</div>
        <h4 style={{fontSize:17,fontWeight:700,marginBottom:10}}>Delete Machine?</h4>
        <p style={{fontSize:13,color:C.textMid,lineHeight:1.6,marginBottom:24}}>
          Permanently delete <strong style={{color:C.text}}>{machine.name}</strong>?<br/>
          All parameters, predictions &amp; schedules will be removed.
        </p>
        <div style={{display:'flex',gap:10,justifyContent:'center'}}>
          <button className="btn bg" onClick={onClose} style={{minWidth:110}}>Cancel</button>
          <button className="btn bd" onClick={onConfirm} style={{minWidth:110}}>Delete</button>
        </div>
      </div>
    </div>
  );
}

const CTip = ({ active, payload }) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:'8px 14px',fontSize:12}}>
      <span style={{color:C.text}}>{payload[0].name}: </span>
      <strong style={{color:payload[0].fill||C.teal}}>{payload[0].value}</strong>
    </div>
  );
};

const PIE_COLS = ['#22c55e','#f59e0b','#f43f5e'];

/* Dashboard */
function DashboardTab({ machines }) {
  const healthy  = machines.filter(m=>m.status==='Healthy').length;
  const moderate = machines.filter(m=>m.status==='Moderate').length;
  const critical = machines.filter(m=>m.status==='Critical').length;
  const total    = machines.length;
  const avgRisk  = total ? (machines.reduce((s,m)=>s+(parseFloat(m.risk_score)||0),0)/total).toFixed(1) : 0;

  const pieData = [{name:'Healthy',value:healthy},{name:'Moderate',value:moderate},{name:'Critical',value:critical}].filter(d=>d.value>0);
  const barData = machines.map(m=>({ name:(m.name||'').length>11?m.name.substring(0,10)+'…':(m.name||''), Risk:parseFloat(m.risk_score)||0 }));
  const alerts  = machines.filter(m=>m.status==='Critical'||m.status==='Moderate').sort((a,b)=>(parseFloat(b.risk_score)||0)-(parseFloat(a.risk_score)||0));

  return (
    <div>
      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}} className="anim">
        {[
          {label:'Total Machines',val:total,color:C.teal,sub:'Monitored'},
          {label:'Healthy',val:healthy,color:C.green,sub:'Operating normally'},
          {label:'Moderate',val:moderate,color:C.amber,sub:'Needs attention'},
          {label:'Critical',val:critical,color:C.red,sub:'Immediate action'},
        ].map(({label,val,color,sub})=>(
          <div key={label} className="ch" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:'20px 22px',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:color,boxShadow:glow(color,4)}}/>
            <div style={{fontSize:10,color:C.textDim,textTransform:'uppercase',letterSpacing:'0.09em',marginBottom:8,fontFamily:C.mono}}>{label}</div>
            <div style={{fontFamily:C.display,fontSize:48,lineHeight:1,color,letterSpacing:'0.02em'}}>{val}</div>
            <div style={{fontSize:11,color:C.textDim,marginTop:6}}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1.6fr',gap:16,marginBottom:22}} className="anim1">
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:'20px 22px'}}>
          <div className="st">Health Distribution</div>
          {pieData.length>0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={3}
                    label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={{stroke:C.border}} fontSize={11}>
                    {pieData.map((_,i)=><Cell key={i} fill={PIE_COLS[i]} stroke="none"/>)}
                  </Pie>
                  <Tooltip content={<CTip/>}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{display:'flex',justifyContent:'center',gap:14,marginTop:6}}>
                {['Healthy','Moderate','Critical'].map((s,i)=>(
                  <div key={s} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:C.textMid}}>
                    <div style={{width:8,height:8,borderRadius:2,background:PIE_COLS[i]}}/>{s}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{height:180,display:'flex',alignItems:'center',justifyContent:'center',color:C.textDim,flexDirection:'column',gap:8}}>
              <div style={{fontSize:28,opacity:0.2}}>◎</div>
              <span style={{fontSize:12}}>No machine data yet</span>
            </div>
          )}
        </div>

        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:'20px 22px'}}>
          <div className="st">Risk Score by Machine</div>
          {barData.length>0 ? (
            <ResponsiveContainer width="100%" height={204}>
              <BarChart data={barData} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                <XAxis dataKey="name" tick={{fontSize:10,fill:C.textDim,fontFamily:C.mono}} axisLine={false} tickLine={false}/>
                <YAxis domain={[0,100]} tick={{fontSize:10,fill:C.textDim,fontFamily:C.mono}} axisLine={false} tickLine={false}/>
                <Tooltip content={<CTip/>}/>
                <Bar dataKey="Risk" fill={C.teal} radius={[4,4,0,0]}
                  label={{position:'top',fontSize:10,fill:C.textDim,fontFamily:C.mono,formatter:v=>v>0?v.toFixed(0):''}}/>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{height:204,display:'flex',alignItems:'center',justifyContent:'center',color:C.textDim,flexDirection:'column',gap:8}}>
              <div style={{fontSize:28,opacity:0.2}}>▐█</div>
              <span style={{fontSize:12}}>Add machines to see chart</span>
            </div>
          )}
        </div>
      </div>

      {/* Fleet avg */}
      {total>0 && (
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:'18px 22px',marginBottom:22,display:'flex',alignItems:'center',gap:20}} className="anim2">
          <div>
            <div style={{fontSize:10,color:C.textDim,textTransform:'uppercase',letterSpacing:'0.09em',fontFamily:C.mono,marginBottom:4}}>Fleet Avg Risk</div>
            <div style={{fontFamily:C.display,fontSize:38,color:parseFloat(avgRisk)>=70?C.red:parseFloat(avgRisk)>=40?C.amber:C.green}}>{avgRisk}%</div>
          </div>
          <div style={{flex:1}}>
            <div style={{height:8,background:C.border,borderRadius:4,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${avgRisk}%`,borderRadius:4,background:`linear-gradient(90deg,${C.green},${C.amber},${C.red})`,transition:'width 0.8s cubic-bezier(.4,0,.2,1)'}}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:C.textDim,marginTop:5,fontFamily:C.mono}}>
              <span>0 SAFE</span><span>50 WARN</span><span>100 CRIT</span>
            </div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:11,color:C.textDim}}>Active alerts</div>
            <div style={{fontFamily:C.display,fontSize:32,color:alerts.length>0?C.red:C.green}}>{alerts.length}</div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length>0 && (
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:'20px 22px'}} className="anim3">
          <div className="st">Active Alerts</div>
          {alerts.map(m=>(
            <div key={m.id} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'12px 14px',borderRadius:9,marginBottom:10,background:m.status==='Critical'?C.redDim:C.amberDim,border:`1px solid ${m.status==='Critical'?'rgba(244,63,94,0.25)':'rgba(245,158,11,0.25)'}`}}>
              <div style={{color:m.status==='Critical'?C.red:C.amber,paddingTop:1}}><IcAlrt/></div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:13,marginBottom:3}}>{m.name}</div>
                <div style={{fontSize:12,color:C.textMid,lineHeight:1.5}}>{m.recommended_action}</div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <StatusBadge status={m.status}/>
                <div style={{fontSize:11,color:C.textDim,marginTop:4,fontFamily:C.mono}}>Risk {parseFloat(m.risk_score)?.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {total===0&&(
        <div style={{background:C.surface,border:`1px dashed ${C.border}`,borderRadius:14,padding:'60px 20px',textAlign:'center',color:C.textDim}}>
          <div style={{fontSize:52,marginBottom:16,opacity:0.12}}>⚙</div>
          <div style={{fontSize:15,color:C.textMid,marginBottom:8}}>No machines monitored yet</div>
          <div style={{fontSize:13}}>Go to <strong style={{color:C.teal}}>Machines</strong> tab to add your first machine</div>
        </div>
      )}
    </div>
  );
}

/* Machines Tab */
function MachinesTab({ machines, onAdd, onEdit, onDelete }) {
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div style={{fontSize:12,color:C.textDim,fontFamily:C.mono,display:'flex',alignItems:'center',gap:8}}>
          <span className="ld"/>{machines.length} machine{machines.length!==1?'s':''} registered
        </div>
        <button className="btn bt" onClick={onAdd}><IcPlus/> New Machine</button>
      </div>

      {machines.length===0 ? (
        <div style={{background:C.surface,border:`1px dashed ${C.border}`,borderRadius:14,padding:'60px 20px',textAlign:'center',color:C.textDim}}>
          <div style={{fontSize:40,marginBottom:14,opacity:0.15}}>⚙</div>
          <div style={{fontSize:14,color:C.textMid,marginBottom:14}}>No machines added yet</div>
          <button className="btn bt" onClick={onAdd}><IcPlus/> Add First Machine</button>
        </div>
      ) : (
        <>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,overflow:'hidden'}} className="anim">
            <table className="dt">
              <thead>
                <tr>
                  <th>Machine</th>
                  <th>Vib mm/s</th>
                  <th>Temp °C</th>
                  <th>Power kW</th>
                  <th>Op. Hrs</th>
                  {/* FIX: Tool Condition is the EXCEPTION, not Op.Hrs */}
                  <th title="EXCEPTION: Only for CNC/cutting machines. NULL for general equipment.">Tool % ⚠</th>
                  <th>Status</th>
                  <th>Risk Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {machines.map(m=>{
                  const vib  = parseFloat(m.vibration)    || 0;
                  const temp = parseFloat(m.temperature)  || 0;
                  const pwr  = parseFloat(m.power_usage)  || 0;
                  const hrs  = parseFloat(m.operational_hours) || 0;
                  const tool = m.tool_condition != null ? parseFloat(m.tool_condition) : null;
                  const risk = parseFloat(m.risk_score)   || 0;

                  const vc  = vib  > 10 ? C.red : vib  > 4  ? C.amber : C.green;
                  const tc  = temp > 90 ? C.red : temp > 65 ? C.amber : C.green;
                  const pc  = pwr  > 80 ? C.red : pwr  > 50 ? C.amber : C.green;
                  const hc  = hrs  > 6000 ? C.red : hrs > 3000 ? C.amber : C.green;
                  const tlc = tool !== null ? (tool < 30 ? C.red : tool < 60 ? C.amber : C.green) : C.textDim;

                  return (
                    <tr key={m.id}>
                      <td>
                        <div style={{fontWeight:600,fontSize:13,marginBottom:2}}>{m.name}</div>
                        <div style={{fontSize:11,color:C.textDim}}>{m.type} · {m.location}</div>
                      </td>
                      <td><span style={{fontFamily:C.mono,fontSize:12,color:vc,fontWeight:700}}>{vib.toFixed(2)}</span></td>
                      <td><span style={{fontFamily:C.mono,fontSize:12,color:tc,fontWeight:700}}>{temp.toFixed(1)}</span></td>
                      <td><span style={{fontFamily:C.mono,fontSize:12,color:pc,fontWeight:700}}>{pwr.toFixed(1)}</span></td>
                      <td><span style={{fontFamily:C.mono,fontSize:12,color:hc,fontWeight:700}}>{hrs.toFixed(0)}</span></td>
                      {/* FIX: Tool Condition shows NULL badge for non-CNC */}
                      <td>
                        {tool !== null
                          ? <span style={{fontFamily:C.mono,fontSize:12,color:tlc,fontWeight:700}}>{tool.toFixed(1)}</span>
                          : <span className="ep" style={{fontSize:8,marginLeft:0}}>NULL</span>
                        }
                      </td>
                      <td><StatusBadge status={m.status}/></td>
                      <td style={{minWidth:130}}><RiskBar score={risk}/></td>
                      <td>
                        <div style={{display:'flex',gap:6}}>
                          <button className="btn bg" style={{padding:'6px 10px'}} onClick={()=>onEdit(m)} title="Edit"><IcEdit/></button>
                          <button className="btn bd" style={{padding:'6px 10px'}} onClick={()=>onDelete(m)} title="Delete"><IcTrsh/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{marginTop:12,fontSize:11,color:C.textDim,display:'flex',alignItems:'center',gap:6}}>
            <IcInfo/> <strong style={{color:C.red}}>⚠ Tool %</strong> = EXCEPTION — NULL for non-CNC machines; applies ±15% risk adjustment for CNC/cutting types only.
            Values in <span style={{color:C.red}}>red</span>/<span style={{color:C.amber}}>amber</span> are out-of-threshold.
          </div>
        </>
      )}
    </div>
  );
}

/* Predictions Tab */
// FIX: weights corrected to match predictionEngine.js and README
function PredictionsTab({ machines }) {
  return (
    <div>
      <div style={{background:`linear-gradient(135deg,rgba(0,210,200,0.06),rgba(0,210,200,0.02))`,border:`1px solid rgba(0,210,200,0.2)`,borderLeft:`3px solid ${C.teal}`,borderRadius:10,padding:'16px 20px',marginBottom:20}} className="anim">
        <div style={{fontFamily:C.mono,fontSize:11,color:C.teal,letterSpacing:'0.08em',marginBottom:10}}>// ML FEATURE ANALYSIS — WEIGHTED SCORING ENGINE</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
          {[
            // FIX: correct weights — Vibration 35%, Temp 25%, Power 20%, Op.Hours 20%
            {name:'Vibration',    status:'ACTIVE',    color:C.green, weight:'35%', icon:'〰️'},
            {name:'Temperature',  status:'ACTIVE',    color:C.green, weight:'25%', icon:'🌡️'},
            {name:'Power Usage',  status:'ACTIVE',    color:C.green, weight:'20%', icon:'⚡'},
            {name:'Op. Hours',    status:'ACTIVE',    color:C.green, weight:'20%', icon:'⏱️'},
            // FIX: Tool Condition is the EXCEPTION
            {name:'Tool Cond.',   status:'EXCEPTION', color:C.red,   weight:'±15% adj', icon:'⚙️'},
          ].map(f=>(
            <div key={f.name} style={{background:f.status==='EXCEPTION'?'rgba(244,63,94,0.06)':'rgba(34,197,94,0.06)',border:`1px solid ${f.status==='EXCEPTION'?'rgba(244,63,94,0.2)':'rgba(34,197,94,0.2)'}`,borderRadius:8,padding:'10px 12px',textAlign:'center'}}>
              <div style={{fontSize:20,marginBottom:6}}>{f.icon}</div>
              <div style={{fontSize:11,fontWeight:600,marginBottom:4}}>{f.name}</div>
              <div style={{fontSize:10,color:f.color,fontFamily:C.mono,fontWeight:700}}>{f.status}</div>
              <div style={{fontSize:10,color:C.textDim,marginTop:2}}>Weight: {f.weight}</div>
            </div>
          ))}
        </div>
        {/* FIX: correct EXCEPTION description */}
        <div style={{background:'rgba(244,63,94,0.06)',border:'1px solid rgba(244,63,94,0.2)',borderLeft:`3px solid ${C.red}`,borderRadius:8,padding:'10px 14px',fontSize:12,color:'#fca5a5',lineHeight:1.7,marginTop:14}}>
          <strong style={{color:C.red}}>⚠ EXCEPTION — Tool Condition:</strong> Not a base feature weight.
          Applies a ±15% adjustment to the final risk score for CNC/cutting machines only.
          For general equipment (compressors, presses, motors), tool_condition = NULL → excluded entirely.
        </div>
      </div>

      {machines.length===0 ? (
        <div style={{background:C.surface,border:`1px dashed ${C.border}`,borderRadius:14,padding:'60px 20px',textAlign:'center',color:C.textDim}}>
          <div style={{fontSize:40,marginBottom:12,opacity:0.15}}>🧠</div>
          <div style={{fontSize:14,color:C.textMid}}>No predictions yet — add machines first</div>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {machines.map((m,i)=>{
            const risk = parseFloat(m.risk_score)||0;
            const sc   = m.status==='Critical'?C.red:m.status==='Moderate'?C.amber:C.green;
            const hasTool = m.tool_condition != null;
            return (
              <div key={m.id} className={`ch anim${Math.min(i,3)}`} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:'20px 22px',position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:sc,boxShadow:glow(sc,6)}}/>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
                  <div>
                    <h4 style={{fontSize:15,fontWeight:700,marginBottom:3}}>{m.name}</h4>
                    <div style={{fontSize:12,color:C.textDim}}>{m.type} · {m.location}</div>
                  </div>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <StatusBadge status={m.status||'Unknown'}/>
                    <PriorityBadge priority={m.priority||'Low'}/>
                  </div>
                </div>

                {/* FIX: correct active/exception labels on parameter cards */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:16}}>
                  {[
                    {icon:'〰️',label:'Vibration',   val:`${(parseFloat(m.vibration)||0).toFixed(2)} mm/s`, color:C.amber,  active:true},
                    {icon:'🌡️',label:'Temperature', val:`${(parseFloat(m.temperature)||0).toFixed(1)}°C`,  color:C.red,    active:true},
                    {icon:'⚡', label:'Power',       val:`${(parseFloat(m.power_usage)||0).toFixed(1)} kW`, color:C.teal,   active:true},
                    {icon:'⏱️',label:'Op. Hours',   val:`${(parseFloat(m.operational_hours)||0).toFixed(0)} hrs`, color:C.green, active:true},
                    {icon:'⚙️',label:'Tool Cond.',  val: hasTool ? `${parseFloat(m.tool_condition).toFixed(1)}%` : 'NULL', color:C.green, active:hasTool, exception:true},
                  ].map(({icon,label,val,color,active,exception})=>(
                    <div key={label} style={{background:C.surface2,borderRadius:10,border:`1px solid ${exception && !active?'rgba(244,63,94,0.15)':C.border}`,padding:'12px 14px',position:'relative'}}>
                      {exception && !active && <span className="ep" style={{position:'absolute',top:6,right:6,fontSize:7}}>NULL</span>}
                      {exception && active  && <span style={{position:'absolute',top:6,right:6,fontSize:7,background:'rgba(0,210,200,0.12)',color:C.teal,border:`1px solid rgba(0,210,200,0.25)`,padding:'1px 5px',borderRadius:3,fontWeight:800,letterSpacing:'0.05em'}}>±15%</span>}
                      <div style={{fontSize:18,marginBottom:6}}>{icon}</div>
                      <div style={{fontSize:10,color:C.textDim,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>{label}</div>
                      <div style={{fontFamily:C.mono,fontSize:13,fontWeight:700,color:active?color:C.textDim}}>{val}</div>
                    </div>
                  ))}
                </div>

                <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:14,marginBottom:14,alignItems:'center'}}>
                  <div><RiskBar score={risk}/></div>
                  <div style={{background:C.surface2,borderRadius:8,padding:'8px 12px',textAlign:'center'}}>
                    <div style={{fontSize:10,color:C.textDim,fontFamily:C.mono,marginBottom:3}}>CONFIDENCE</div>
                    <div style={{fontFamily:C.mono,fontSize:16,fontWeight:700,color:C.teal}}>{parseFloat(m.confidence)?.toFixed(1)}%</div>
                  </div>
                  <div style={{background:C.surface2,borderRadius:8,padding:'8px 12px',textAlign:'center'}}>
                    <div style={{fontSize:10,color:C.textDim,fontFamily:C.mono,marginBottom:3}}>MAINT. IN</div>
                    <div style={{fontFamily:C.mono,fontSize:16,fontWeight:700,color:m.days_until_maintenance<=3?C.red:C.amber}}>{m.days_until_maintenance}d</div>
                  </div>
                </div>

                <div style={{background:C.bgDeep,borderRadius:8,padding:'11px 14px',fontSize:12,color:C.textMid,lineHeight:1.6,borderLeft:`3px solid ${sc}`}}>
                  <span style={{color:C.textDim,fontFamily:C.mono,fontSize:10}}>RECOMMENDED ACTION // </span>
                  {m.recommended_action||'—'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* Schedule Tab */
function ScheduleTab() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/schedule`);
      const data = await res.json();
      if (data.success) setSchedule(data.data);
    } catch {}
    setLoading(false);
  },[]);

  useEffect(()=>{ load(); },[load]);

  const upd = async (id, status) => {
    await fetch(`${API}/schedule/${id}`, {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});
    load();
  };

  const stCol = s => ({
    Completed:   {color:C.green,   bg:C.greenDim},
    'In Progress':{color:C.teal,   bg:C.tealDim},
    Cancelled:   {color:C.textDim, bg:'transparent'},
    Pending:     {color:C.amber,   bg:C.amberDim},
  }[s]||{color:C.textMid,bg:'transparent'});

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:60,color:C.textDim,gap:12}}>
      <div style={{animation:'spin 1s linear infinite'}}><IcRef/></div>Loading schedule...
    </div>
  );

  return (
    <div>
      {schedule.length===0 ? (
        <div style={{background:C.surface,border:`1px dashed ${C.border}`,borderRadius:14,padding:'60px 20px',textAlign:'center',color:C.textDim}}>
          <div style={{fontSize:40,marginBottom:12,opacity:0.15}}>📅</div>
          <div style={{fontSize:14,color:C.textMid,marginBottom:6}}>No scheduled maintenance</div>
          <div style={{fontSize:12}}>Machines with Critical or Moderate status auto-generate schedule entries</div>
        </div>
      ) : (
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,overflow:'hidden'}} className="anim">
          <table className="dt">
            <thead>
              <tr>
                <th>Machine</th><th>Scheduled Date</th><th>Duration</th>
                <th>Priority</th><th>Status</th><th>Task</th><th>Update</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map(s=>{
                const st = stCol(s.status);
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{fontWeight:600,fontSize:13}}>{s.machine_name}</div>
                      <div style={{fontSize:11,color:C.textDim}}>{s.machine_type}</div>
                    </td>
                    <td style={{fontFamily:C.mono,fontSize:12,color:C.teal}}>{s.scheduled_date?.split('T')[0]}</td>
                    <td style={{fontFamily:C.mono,fontSize:12}}>{s.estimated_duration_hours}h</td>
                    <td><PriorityBadge priority={s.priority}/></td>
                    <td><span style={{background:st.bg,color:st.color,padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700}}>{s.status}</span></td>
                    <td style={{maxWidth:200,fontSize:12,color:C.textMid}}>{(s.task_description||'').substring(0,80)}{(s.task_description||'').length>80?'…':''}</td>
                    <td>
                      <select className="fsel" style={{fontSize:12,padding:'5px 10px',width:'auto',minWidth:130}} value={s.status} onChange={e=>upd(s.id,e.target.value)}>
                        {['Pending','In Progress','Completed','Cancelled'].map(o=><option key={o}>{o}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* Root App */
const NAV = [
  {id:'dashboard',   label:'Dashboard',     Icon:IcDash},
  {id:'machines',    label:'Machines',       Icon:IcMach},
  {id:'predictions', label:'AI Predictions', Icon:IcBrain},
  {id:'schedule',    label:'Schedule',       Icon:IcCal},
];
const META = {
  dashboard:   {title:'DASHBOARD',      sub:'Fleet overview & health monitoring'},
  machines:    {title:'MACHINES',       sub:'Add, edit or remove monitored equipment'},
  predictions: {title:'AI PREDICTIONS', sub:'Weighted scoring predictive maintenance analysis'},
  schedule:    {title:'MAINT. SCHEDULE',sub:'Optimized timeline & task tracking'},
};

export default function App() {
  const [tab,setTab]       = useState('dashboard');
  const [machines,setM]    = useState([]);
  const [loading,setLoad]  = useState(true);
  const [showForm,setForm] = useState(false);
  const [editM,setEdit]    = useState(null);
  const [delM,setDel]      = useState(null);
  const [toast,setToast]   = useState(null);

  const toast$ = (message, type='success') => setToast({message, type});

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API}/machines`);
      const d = await r.json();
      if (d.success) setM(d.data);
      else toast$('Failed to load machines','error');
    } catch { toast$('Cannot connect to backend — ensure server runs on :5000','error'); }
    setLoad(false);
  },[]);

  useEffect(()=>{ load(); },[load]);

  const onSave = () => {
    toast$(editM ? 'Machine updated & prediction refreshed' : 'Machine added — AI prediction generated');
    setForm(false); setEdit(null); load();
  };

  const onDel = async () => {
    try {
      const r = await fetch(`${API}/machines/${delM.id}`,{method:'DELETE'});
      const d = await r.json();
      toast$(d.success ? 'Machine deleted' : d.message, d.success ? 'success' : 'error');
      if (d.success) load();
    } catch { toast$('Delete failed','error'); }
    setDel(null);
  };

  const meta = META[tab];

  return (
    <>
      <GlobalStyles/>
      <div style={{display:'flex',minHeight:'100vh'}}>

        {/* Sidebar */}
        <aside style={{width:228,background:C.surface,borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column',padding:'0 0 20px',position:'sticky',top:0,height:'100vh',flexShrink:0}}>
          <div style={{padding:'22px 18px 20px',borderBottom:`1px solid ${C.border}`,marginBottom:12,position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',inset:0,opacity:0.04,backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='52'%3E%3Cpath d='M30 0 L60 17 L60 34 L30 52 L0 34 L0 17Z' fill='none' stroke='%2300d2c8' stroke-width='1'/%3E%3C/svg%3E")`,backgroundSize:'60px 52px',pointerEvents:'none'}}/>
            <div style={{fontFamily:C.mono,fontSize:10,color:C.teal,letterSpacing:'0.09em',marginBottom:6}}>// ADCET · MECH ENGG · AI</div>
            <div style={{fontFamily:C.display,fontSize:24,letterSpacing:'0.05em',lineHeight:1.1,color:C.text}}>
              WORKSHOP<br/>MAINTENANCE<br/><span style={{color:C.teal}}>SYSTEM</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:7,marginTop:12}}>
              <span className="ld"/>
              <span style={{fontSize:10,color:C.textDim,fontFamily:C.mono}}>PREDICTIVE · LIVE</span>
            </div>
          </div>

          <nav style={{flex:1,padding:'4px 10px'}}>
            {NAV.map(({id,label,Icon})=>(
              <button key={id} className={`nav-btn${tab===id?' active':''}`} onClick={()=>setTab(id)}>
                <Icon/>{label}
              </button>
            ))}
          </nav>

          <div style={{padding:'14px 18px',borderTop:`1px solid ${C.border}`,fontSize:11,color:C.textDim,lineHeight:1.9,fontFamily:C.mono}}>
            Guide: Ms. R.P. Mali<br/>
            TY BTech · Minor Project<br/>
            <span style={{color:C.border}}>─────────────────</span><br/>
            <span style={{color:C.teal}}>v2.0</span> · MySQL Edition
          </div>
        </aside>

        {/* Main */}
        <main style={{flex:1,padding:'28px 32px',overflowY:'auto',minWidth:0}}>
          <div style={{marginBottom:26,paddingBottom:18,borderBottom:`1px solid ${C.border}`}}>
            <div style={{fontFamily:C.mono,fontSize:10,color:C.textDim,letterSpacing:'0.1em',marginBottom:6}}>// {meta.title}</div>
            <h2 style={{fontFamily:C.display,fontSize:30,letterSpacing:'0.05em',lineHeight:1}}>{meta.title}</h2>
            <p style={{fontSize:13,color:C.textMid,marginTop:6}}>{meta.sub}</p>
          </div>

          {loading ? (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'80px 20px',color:C.textDim,gap:12}}>
              <div style={{animation:'spin 1s linear infinite'}}><IcRef/></div>
              Connecting to backend...
            </div>
          ) : (
            <>
              {tab==='dashboard'   && <DashboardTab machines={machines}/>}
              {tab==='machines'    && <MachinesTab machines={machines} onAdd={()=>{setEdit(null);setForm(true);}} onEdit={m=>{setEdit(m);setForm(true);}} onDelete={m=>setDel(m)}/>}
              {tab==='predictions' && <PredictionsTab machines={machines}/>}
              {tab==='schedule'    && <ScheduleTab/>}
            </>
          )}
        </main>
      </div>

      {showForm && <MachineModal machine={editM} onSave={onSave} onClose={()=>{setForm(false);setEdit(null);}}/>}
      {delM     && <DeleteConfirm machine={delM} onConfirm={onDel} onClose={()=>setDel(null)}/>}
      {toast    && <Toast {...toast} onClose={()=>setToast(null)}/>}
    </>
  );
}