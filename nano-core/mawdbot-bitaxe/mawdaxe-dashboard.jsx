import { useState, useEffect, useCallback } from "react";

// ─── Simulated Fleet Data ────────────────────────────────────
const STAGES = ["egg","larva","juvenile","adult","alpha","ghost"];
const MOODS = ["ecstatic","happy","neutral","anxious","sad","hot"];
const STAGE_EMOJI = {egg:"🥚",larva:"🦐",juvenile:"🦞",adult:"🦞",alpha:"👑",ghost:"💀"};
const MOOD_COLORS = {ecstatic:"#00ffc8",happy:"#00ff40",neutral:"#888",anxious:"#ffc800",sad:"#4488ff",hot:"#ff2200"};

function generateDevice(id, idx) {
  const hr = 580 + Math.random()*80;
  const temp = 45 + Math.random()*20;
  const shares = Math.floor(Math.random()*300);
  const rejected = Math.floor(Math.random()*8);
  const stage = shares > 200 ? "alpha" : shares > 50 ? "adult" : shares > 10 ? "juvenile" : shares > 0 ? "larva" : "egg";
  const moodIdx = temp > 68 ? 5 : temp > 60 ? 3 : hr > 620 ? 0 : 1;
  const mood = MOODS[moodIdx];
  const moodScore = 1 - (moodIdx/5)*2;
  return {
    id: `mawdaxe-${String(idx+1).padStart(3,"0")}`, ip: `192.168.1.${42+idx}`,
    state: "running", health: temp > 70 ? "critical" : temp > 62 ? "warning" : "healthy",
    hashRate: hr, temp, power: 15 + Math.random()*3, shares, rejected,
    uptime: 2 + Math.random()*48, fanSpeed: Math.floor(40+Math.random()*60), freq: 525 + Math.floor(Math.random()*75),
    pet: { stage, mood, moodScore, name: `MawdPet-${String(idx+1).padStart(3,"0")}`, totalShares: shares, feedCount: shares*12 }
  };
}

// ─── Component ───────────────────────────────────────────────
export default function MawdAxeDashboard() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [view, setView] = useState("fleet"); // fleet | device | pet
  const [tick, setTick] = useState(0);
  const [deviceCount, setDeviceCount] = useState(4);

  // Simulate live data
  useEffect(() => {
    const devs = Array.from({length: deviceCount}, (_, i) => generateDevice(i, i));
    setDevices(devs);
    if (!selectedDevice && devs.length) setSelectedDevice(devs[0].id);
  }, [deviceCount]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
      setDevices(prev => prev.map(d => ({
        ...d,
        hashRate: d.hashRate + (Math.random()-0.5)*8,
        temp: Math.max(40, Math.min(78, d.temp + (Math.random()-0.5)*1.5)),
        shares: d.shares + (Math.random() > 0.7 ? 1 : 0),
        power: d.power + (Math.random()-0.5)*0.3,
        pet: { ...d.pet, moodScore: Math.max(-1, Math.min(1, d.pet.moodScore + (Math.random()-0.5)*0.05)) }
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const fleet = {
    total: devices.length,
    online: devices.filter(d => d.health !== "offline").length,
    hashRate: devices.reduce((s,d) => s + d.hashRate, 0),
    avgTemp: devices.reduce((s,d) => s + d.temp, 0) / (devices.length || 1),
    totalPower: devices.reduce((s,d) => s + d.power, 0),
    totalShares: devices.reduce((s,d) => s + d.shares, 0),
  };

  const sel = devices.find(d => d.id === selectedDevice);

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0f",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      color: "#e0e0e0", padding: 0, margin: 0, overflow: "hidden",
    }}>
      {/* Scanline overlay */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 100,
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
      }}/>

      {/* Header */}
      <div style={{
        background: "linear-gradient(90deg, #ff6600 0%, #ff3300 50%, #ff6600 100%)",
        padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "2px solid #ff6600",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:28}}>🦞</span>
          <div>
            <div style={{fontSize:18,fontWeight:900,color:"#000",letterSpacing:3}}>MAWDAXE</div>
            <div style={{fontSize:9,color:"#000",opacity:0.7,letterSpacing:2}}>AUTONOMOUS MINING AGENT</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {["fleet","device","pet"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              background: view===v ? "#000" : "rgba(0,0,0,0.2)", color: view===v ? "#ff6600" : "#000",
              border: "1px solid #000", padding: "4px 14px", borderRadius: 2,
              fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 1,
              textTransform: "uppercase", fontFamily: "inherit",
            }}>{v}</button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:"#00ff40",animation:"pulse 2s infinite"}}/>
          <span style={{fontSize:10,color:"#000",fontWeight:700}}>OODA ACTIVE</span>
        </div>
      </div>

      <div style={{padding: "16px 20px"}}>
        {view === "fleet" && <FleetView fleet={fleet} devices={devices} selectedDevice={selectedDevice} setSelectedDevice={(id) => { setSelectedDevice(id); setView("device"); }} setDeviceCount={setDeviceCount} deviceCount={deviceCount} />}
        {view === "device" && sel && <DeviceView device={sel} onBack={() => setView("fleet")} />}
        {view === "pet" && sel && <PetView device={sel} onBack={() => setView("fleet")} />}
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 8px #ff660066; } 50% { box-shadow: 0 0 20px #ff660099; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}

// ─── Fleet View ──────────────────────────────────────────────
function FleetView({ fleet, devices, selectedDevice, setSelectedDevice, setDeviceCount, deviceCount }) {
  return (
    <div style={{animation:"slideUp 0.3s ease"}}>
      {/* Scale controls */}
      <div style={{display:"flex",gap:8,marginBottom:16,alignItems:"center"}}>
        <span style={{fontSize:10,color:"#666",letterSpacing:1}}>FLEET SIZE:</span>
        {[1,4,10,25].map(n => (
          <button key={n} onClick={() => setDeviceCount(n)} style={{
            background: deviceCount===n ? "#ff6600" : "#1a1a2e", color: deviceCount===n ? "#000" : "#888",
            border: `1px solid ${deviceCount===n ? "#ff6600" : "#333"}`, padding: "3px 10px",
            fontSize: 10, cursor: "pointer", borderRadius: 2, fontFamily: "inherit",
          }}>{n}</button>
        ))}
      </div>

      {/* Fleet Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:20}}>
        {[
          {label:"DEVICES",value:fleet.total,color:"#ff6600"},
          {label:"ONLINE",value:fleet.online,color:"#00ff40"},
          {label:"TOTAL GH/s",value:fleet.hashRate.toFixed(1),color:"#00ddff"},
          {label:"AVG TEMP",value:`${fleet.avgTemp.toFixed(1)}°C`,color:fleet.avgTemp>65?"#ff2200":fleet.avgTemp>55?"#ffc800":"#00ff40"},
          {label:"TOTAL WATTS",value:fleet.totalPower.toFixed(1),color:"#cc88ff"},
          {label:"SHARES",value:fleet.totalShares,color:"#ffaa00"},
        ].map(s => (
          <div key={s.label} style={{
            background:"#12121f",border:"1px solid #222",borderRadius:4,padding:"12px 14px",
            borderLeft:`3px solid ${s.color}`,
          }}>
            <div style={{fontSize:9,color:"#666",letterSpacing:2,marginBottom:4}}>{s.label}</div>
            <div style={{fontSize:20,fontWeight:900,color:s.color}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Device Grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
        {devices.map(d => (
          <div key={d.id} onClick={() => setSelectedDevice(d.id)} style={{
            background: "#12121f", border: `1px solid ${d.id===selectedDevice?"#ff6600":"#222"}`,
            borderRadius: 6, padding: 14, cursor: "pointer", transition: "all 0.2s",
            animation: "glow 3s infinite",
          }}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:20}}>{STAGE_EMOJI[d.pet.stage]}</span>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:"#ff6600"}}>{d.id}</div>
                  <div style={{fontSize:9,color:"#666"}}>{d.ip}</div>
                </div>
              </div>
              <div style={{
                width:10,height:10,borderRadius:"50%",
                background: d.health==="healthy"?"#00ff40":d.health==="warning"?"#ffc800":"#ff2200",
              }}/>
            </div>

            {/* Mini stats */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
              {[
                {label:"GH/s",value:d.hashRate.toFixed(1),color:"#00ddff"},
                {label:"TEMP",value:`${d.temp.toFixed(1)}°`,color:d.temp>65?"#ff2200":"#00ff40"},
                {label:"SHARES",value:d.shares,color:"#ffaa00"},
              ].map(s => (
                <div key={s.label} style={{background:"#0a0a15",padding:"6px 8px",borderRadius:3,textAlign:"center"}}>
                  <div style={{fontSize:8,color:"#555",letterSpacing:1}}>{s.label}</div>
                  <div style={{fontSize:14,fontWeight:700,color:s.color}}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Pet mood bar */}
            <div style={{marginTop:8,display:"flex",alignItems:"center",gap:8}}>
              <div style={{flex:1,height:4,background:"#1a1a2e",borderRadius:2,overflow:"hidden"}}>
                <div style={{
                  width:`${((d.pet.moodScore+1)/2)*100}%`,height:"100%",
                  background:MOOD_COLORS[d.pet.mood],borderRadius:2,transition:"width 0.5s",
                }}/>
              </div>
              <span style={{fontSize:8,color:MOOD_COLORS[d.pet.mood],textTransform:"uppercase",letterSpacing:1}}>
                {d.pet.mood}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Device View ─────────────────────────────────────────────
function DeviceView({ device: d, onBack }) {
  const [history] = useState(() => Array.from({length:30}, (_, i) => ({
    t: i, hr: 580+Math.random()*60, temp: 48+Math.random()*15, power: 15+Math.random()*3,
  })));

  const healthColor = d.health==="healthy"?"#00ff40":d.health==="warning"?"#ffc800":"#ff2200";

  return (
    <div style={{animation:"slideUp 0.3s ease"}}>
      <button onClick={onBack} style={{
        background:"none",border:"1px solid #333",color:"#888",padding:"4px 12px",
        fontSize:10,cursor:"pointer",marginBottom:16,borderRadius:2,fontFamily:"inherit",
      }}>← FLEET</button>

      <div style={{display:"flex",gap:16,alignItems:"flex-start",flexWrap:"wrap"}}>
        {/* Left: Device Info */}
        <div style={{flex:"1 1 340px"}}>
          <div style={{background:"#12121f",border:"1px solid #222",borderRadius:6,padding:20,marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div>
                <div style={{fontSize:20,fontWeight:900,color:"#ff6600",letterSpacing:2}}>{d.id}</div>
                <div style={{fontSize:11,color:"#666"}}>{d.ip} • {d.state}</div>
              </div>
              <div style={{
                padding:"4px 12px",borderRadius:20,fontSize:10,fontWeight:700,letterSpacing:1,
                background:`${healthColor}22`,color:healthColor,border:`1px solid ${healthColor}44`,
                textTransform:"uppercase",
              }}>{d.health}</div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
              {[
                {label:"HASHRATE",value:`${d.hashRate.toFixed(1)} GH/s`,color:"#00ddff"},
                {label:"TEMPERATURE",value:`${d.temp.toFixed(1)}°C`,color:d.temp>65?"#ff2200":"#00ff40"},
                {label:"POWER",value:`${d.power.toFixed(1)}W`,color:"#cc88ff"},
                {label:"FREQ",value:`${d.freq} MHz`,color:"#ffaa00"},
                {label:"FAN",value:`${d.fanSpeed}%`,color:"#00ddff"},
                {label:"EFFICIENCY",value:`${(d.hashRate/d.power).toFixed(1)} GH/J`,color:"#00ff80"},
                {label:"SHARES",value:d.shares,color:"#00ff40"},
                {label:"REJECTED",value:d.rejected,color:"#ff4444"},
                {label:"UPTIME",value:`${d.uptime.toFixed(1)}h`,color:"#888"},
              ].map(s => (
                <div key={s.label} style={{background:"#0a0a15",padding:"10px 12px",borderRadius:4}}>
                  <div style={{fontSize:8,color:"#555",letterSpacing:2,marginBottom:3}}>{s.label}</div>
                  <div style={{fontSize:16,fontWeight:700,color:s.color}}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* OODA Decision Log */}
          <div style={{background:"#12121f",border:"1px solid #222",borderRadius:6,padding:16}}>
            <div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:10}}>OODA DECISION LOG</div>
            {[
              {action:"hold",reason:"Nominal operation — all metrics within range",time:"2s ago",color:"#00ff40"},
              {action:"hold",reason:"Nominal operation — hashrate stable at 623 GH/s",time:"12s ago",color:"#00ff40"},
              {action:"tune_up",reason:`Temp ${(d.temp-5).toFixed(1)}°C well under limit, overclocking +25MHz`,time:"32s ago",color:"#00ddff"},
              {action:"hold",reason:"Nominal operation",time:"42s ago",color:"#00ff40"},
            ].map((log,i) => (
              <div key={i} style={{
                display:"flex",gap:8,alignItems:"center",padding:"6px 0",
                borderBottom: i < 3 ? "1px solid #1a1a2e" : "none",
              }}>
                <div style={{
                  fontSize:8,fontWeight:700,color:log.color,background:`${log.color}15`,
                  padding:"2px 6px",borderRadius:2,minWidth:60,textAlign:"center",
                  textTransform:"uppercase",letterSpacing:1,
                }}>{log.action}</div>
                <div style={{fontSize:10,color:"#888",flex:1}}>{log.reason}</div>
                <div style={{fontSize:9,color:"#555"}}>{log.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Mini Chart + Pet */}
        <div style={{flex:"1 1 260px"}}>
          {/* Hashrate sparkline */}
          <div style={{background:"#12121f",border:"1px solid #222",borderRadius:6,padding:16,marginBottom:12}}>
            <div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:8}}>HASHRATE (30 CYCLES)</div>
            <svg viewBox="0 0 300 80" style={{width:"100%",height:80}}>
              <defs>
                <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ddff" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#00ddff" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d={`M0,80 ${history.map((h,i) => `L${i*10},${80-((h.hr-560)/80)*70}`).join(" ")} L290,80 Z`} fill="url(#hrGrad)"/>
              <path d={history.map((h,i) => `${i===0?"M":"L"}${i*10},${80-((h.hr-560)/80)*70}`).join(" ")} fill="none" stroke="#00ddff" strokeWidth="1.5"/>
            </svg>
          </div>

          {/* Temp sparkline */}
          <div style={{background:"#12121f",border:"1px solid #222",borderRadius:6,padding:16,marginBottom:12}}>
            <div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:8}}>TEMPERATURE (30 CYCLES)</div>
            <svg viewBox="0 0 300 80" style={{width:"100%",height:80}}>
              <defs>
                <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff6600" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#ff6600" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="300" height={80-((65-40)/35)*70} fill="#ff220008"/>
              <path d={`M0,80 ${history.map((h,i) => `L${i*10},${80-((h.temp-40)/35)*70}`).join(" ")} L290,80 Z`} fill="url(#tGrad)"/>
              <path d={history.map((h,i) => `${i===0?"M":"L"}${i*10},${80-((h.temp-40)/35)*70}`).join(" ")} fill="none" stroke="#ff6600" strokeWidth="1.5"/>
              <line x1="0" y1={80-((65-40)/35)*70} x2="300" y2={80-((65-40)/35)*70} stroke="#ff660044" strokeWidth="1" strokeDasharray="4,4"/>
            </svg>
          </div>

          {/* Pet card */}
          <div style={{
            background:"linear-gradient(135deg, #1a0a2e, #12121f)",
            border:"1px solid #ff660044",borderRadius:6,padding:16,textAlign:"center",
          }}>
            <div style={{fontSize:48,marginBottom:8}}>{STAGE_EMOJI[d.pet.stage]}</div>
            <div style={{fontSize:14,fontWeight:700,color:"#ff6600"}}>{d.pet.name}</div>
            <div style={{fontSize:11,color:MOOD_COLORS[d.pet.mood],textTransform:"uppercase",letterSpacing:2}}>
              {d.pet.stage} • {d.pet.mood}
            </div>
            <div style={{marginTop:10,display:"flex",gap:8,justifyContent:"center"}}>
              <Stat label="Shares" value={d.pet.totalShares} />
              <Stat label="Feeds" value={d.pet.feedCount} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({label, value}) {
  return (
    <div style={{background:"#0a0a15",padding:"6px 12px",borderRadius:3}}>
      <div style={{fontSize:7,color:"#555",letterSpacing:1}}>{label}</div>
      <div style={{fontSize:13,fontWeight:700,color:"#ff6600"}}>{value}</div>
    </div>
  );
}

// ─── Pet View ────────────────────────────────────────────────
function PetView({ device: d, onBack }) {
  const stages = ["egg","larva","juvenile","adult","alpha"];
  const currentIdx = stages.indexOf(d.pet.stage);

  return (
    <div style={{animation:"slideUp 0.3s ease",maxWidth:600,margin:"0 auto"}}>
      <button onClick={onBack} style={{
        background:"none",border:"1px solid #333",color:"#888",padding:"4px 12px",
        fontSize:10,cursor:"pointer",marginBottom:16,borderRadius:2,fontFamily:"inherit",
      }}>← FLEET</button>

      <div style={{
        background:"linear-gradient(180deg, #1a0a2e 0%, #0a0a15 100%)",
        border:"2px solid #ff6600",borderRadius:12,padding:32,textAlign:"center",
      }}>
        {/* Pet display */}
        <div style={{
          width:200,height:200,margin:"0 auto 20px",
          background:"#000",borderRadius:12,border:"3px solid #ff660066",
          display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:"0 0 40px #ff660022, inset 0 0 40px #ff660011",
          position:"relative",overflow:"hidden",
        }}>
          {/* CRT effect */}
          <div style={{
            position:"absolute",inset:0,
            background:"repeating-linear-gradient(0deg,transparent,transparent 1px,rgba(255,102,0,0.03) 1px,rgba(255,102,0,0.03) 2px)",
          }}/>
          <div style={{fontSize:80,filter:`drop-shadow(0 0 20px ${MOOD_COLORS[d.pet.mood]})`}}>
            {STAGE_EMOJI[d.pet.stage]}
          </div>
        </div>

        <div style={{fontSize:22,fontWeight:900,color:"#ff6600",letterSpacing:3,marginBottom:4}}>
          {d.pet.name}
        </div>
        <div style={{fontSize:12,color:MOOD_COLORS[d.pet.mood],letterSpacing:2,textTransform:"uppercase",marginBottom:20}}>
          Feeling {d.pet.mood}
        </div>

        {/* Mood gauge */}
        <div style={{marginBottom:24}}>
          <div style={{fontSize:9,color:"#666",letterSpacing:2,marginBottom:6}}>MOOD SCORE</div>
          <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
            <span style={{fontSize:10,color:"#ff2200"}}>SAD</span>
            <div style={{width:200,height:8,background:"#1a1a2e",borderRadius:4,position:"relative"}}>
              <div style={{
                position:"absolute",
                left:`${((d.pet.moodScore+1)/2)*100}%`,
                top:-2,width:12,height:12,borderRadius:"50%",
                background:MOOD_COLORS[d.pet.mood],border:"2px solid #fff",
                transform:"translateX(-50%)",transition:"left 0.5s",
                boxShadow:`0 0 10px ${MOOD_COLORS[d.pet.mood]}`,
              }}/>
              <div style={{
                position:"absolute",left:0,top:0,bottom:0,borderRadius:4,
                width:`${((d.pet.moodScore+1)/2)*100}%`,
                background:`linear-gradient(90deg, #ff2200, #ffc800, #00ff40, #00ffc8)`,
                opacity:0.3,
              }}/>
            </div>
            <span style={{fontSize:10,color:"#00ffc8"}}>ECSTATIC</span>
          </div>
        </div>

        {/* Evolution progress */}
        <div style={{marginBottom:24}}>
          <div style={{fontSize:9,color:"#666",letterSpacing:2,marginBottom:10}}>EVOLUTION PATH</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
            {stages.map((s,i) => (
              <div key={s} style={{display:"flex",alignItems:"center",gap:4}}>
                <div style={{
                  width:40,height:40,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                  background: i <= currentIdx ? "#ff660022" : "#111",
                  border: `2px solid ${i <= currentIdx ? "#ff6600" : "#333"}`,
                  fontSize: 18, opacity: i <= currentIdx ? 1 : 0.4,
                  boxShadow: i === currentIdx ? "0 0 15px #ff660066" : "none",
                }}>
                  {STAGE_EMOJI[s]}
                </div>
                {i < stages.length-1 && (
                  <div style={{width:20,height:2,background:i<currentIdx?"#ff6600":"#333"}}/>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stats grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {[
            {label:"TOTAL SHARES",value:d.pet.totalShares},
            {label:"FEED COUNT",value:d.pet.feedCount},
            {label:"ACCEPT RATE",value:`${(d.shares/(d.shares+d.rejected)*100||0).toFixed(1)}%`},
            {label:"AVG HASHRATE",value:`${d.hashRate.toFixed(0)} GH/s`},
            {label:"AVG TEMP",value:`${d.temp.toFixed(1)}°C`},
            {label:"STAGE",value:d.pet.stage.toUpperCase()},
          ].map(s => (
            <div key={s.label} style={{background:"#0a0a15",padding:"10px",borderRadius:4,border:"1px solid #1a1a2e"}}>
              <div style={{fontSize:7,color:"#555",letterSpacing:2,marginBottom:3}}>{s.label}</div>
              <div style={{fontSize:14,fontWeight:700,color:"#ff6600"}}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
