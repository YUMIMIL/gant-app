import { useState, useEffect, useRef, useCallback } from "react";

const MONTHS = ["3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
const TOTAL = 9;
const PRIORITY_COLOR = { HIGH: "#c9a8e0", MED: "#f0c4d4", LOW: "#778899" };
const PRIORITY_LABEL = { HIGH: "最優先", MED: "中優先", LOW: "低優先" };
const COLORS = ["#c9a8e0","#f0c4d4","#9ec8f0","#a8e0c9","#e0d4a8","#e0a8c9","#c9cfe0","#f0dca8","#a8c9e0","#d4e0a8"];

const DEFAULT_PROJECTS = [
  { id:"axis", name:"AXIS", desc:"クリニック管理コンサルAI", color:"#c9a8e0", priority:"HIGH",
    phases:[
      { id:"p1", label:"ペルソナ確定済", start:0, end:1, done:true },
      { id:"p2", label:"アーキテクチャ構築", start:1, end:3, done:false },
      { id:"p3", label:"ベータ運用", start:3, end:5, done:false },
      { id:"p4", label:"外販開始", start:5, end:7, done:false },
    ], monetize:"¥30,000/month × 30クライアント", monetizeAt:5 },
  { id:"hana", name:"HANA", desc:"クリニックSNSエージェント", color:"#f0c4d4", priority:"HIGH",
    phases:[
      { id:"p1", label:"LENS統合済", start:0, end:1, done:true },
      { id:"p2", label:"外販準備", start:1, end:2, done:false },
      { id:"p3", label:"クライアント獲得", start:2, end:5, done:false },
    ], monetize:"¥30,000/month × 30クライアント", monetizeAt:4 },
  { id:"nocturia", name:"NOCTURIA", desc:"乙女×経営シミュゲー", color:"#9ec8f0", priority:"HIGH",
    phases:[
      { id:"p1", label:"キャラ・設定確定", start:0, end:1, done:true },
      { id:"p2", label:"Phaser.js実装", start:1, end:3, done:false },
      { id:"p3", label:"Firebase/Stripe連携", start:3, end:4, done:false },
      { id:"p4", label:"リリース", start:4, end:5, done:false },
    ], monetize:"Stripe課金", monetizeAt:4 },
  { id:"linemenu", name:"LINE Rich Menu", desc:"美容サロン向けSaaS", color:"#a8e0c9", priority:"MED",
    phases:[
      { id:"p1", label:"LORE CLINIC稼働中", start:0, end:1, done:true },
      { id:"p2", label:"マルチテナント化", start:1, end:2, done:false },
      { id:"p3", label:"営業開始", start:2, end:5, done:false },
    ], monetize:"¥11,000初期 + ¥990/month", monetizeAt:2 },
];

function uid() { return Math.random().toString(36).slice(2,9); }

// ---- Modal ----
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:"#0f0f1a", border:"1px solid #2a2a3e", borderRadius:12, padding:"28px 28px 24px", minWidth:360, maxWidth:500, width:"90vw", maxHeight:"85vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontFamily:"Georgia,serif", fontSize:16, color:"#c9a8e0" }}>{title}</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#555", fontSize:18, cursor:"pointer", lineHeight:1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:9, color:"#888", letterSpacing:2, marginBottom:5, textTransform:"uppercase" }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle = {
  width:"100%", background:"#0b0b14", border:"1px solid #2a2a3e", borderRadius:6,
  color:"#e0d8f0", padding:"8px 10px", fontSize:12, fontFamily:"'Space Mono',monospace",
  boxSizing:"border-box", outline:"none",
};

// ---- ProjectForm ----
function ProjectForm({ initial, onSave, onCancel }) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [desc, setDesc] = useState(initial?.desc ?? "");
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);
  const [priority, setPriority] = useState(initial?.priority ?? "MED");
  const [monetize, setMonetize] = useState(initial?.monetize ?? "");
  const [monetizeAt, setMonetizeAt] = useState(initial?.monetizeAt ?? 3);
  const [phases, setPhases] = useState(initial?.phases ?? [{ id:uid(), label:"フェーズ1", start:0, end:2, done:false }]);

  const addPhase = () => setPhases(p => [...p, { id:uid(), label:"新フェーズ", start:0, end:1, done:false }]);
  const removePhase = id => setPhases(p => p.filter(x => x.id !== id));
  const updatePhase = (id, key, val) => setPhases(p => p.map(x => x.id === id ? { ...x, [key]: val } : x));

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ id: initial?.id ?? uid(), name: name.trim(), desc, color, priority, monetize, monetizeAt: Number(monetizeAt), phases });
  };

  return (
    <>
      <Field label="プロジェクト名">
        <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="例: AXIS" />
      </Field>
      <Field label="説明">
        <input style={inputStyle} value={desc} onChange={e => setDesc(e.target.value)} placeholder="例: クリニック管理AIエージェント" />
      </Field>
      <Field label="優先度">
        <div style={{ display:"flex", gap:8 }}>
          {["HIGH","MED","LOW"].map(p => (
            <button key={p} onClick={() => setPriority(p)} style={{
              flex:1, padding:"6px 0", borderRadius:6, cursor:"pointer", fontSize:10,
              background: priority === p ? PRIORITY_COLOR[p]+"33" : "#0b0b14",
              border: `1px solid ${priority === p ? PRIORITY_COLOR[p] : "#2a2a3e"}`,
              color: priority === p ? PRIORITY_COLOR[p] : "#666",
            }}>{PRIORITY_LABEL[p]}</button>
          ))}
        </div>
      </Field>
      <Field label="カラー">
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {COLORS.map(c => (
            <div key={c} onClick={() => setColor(c)} style={{
              width:24, height:24, borderRadius:"50%", background:c, cursor:"pointer",
              border: color === c ? "2px solid #fff" : "2px solid transparent",
            }} />
          ))}
        </div>
      </Field>
      <Field label="マネタイズ目標">
        <input style={inputStyle} value={monetize} onChange={e => setMonetize(e.target.value)} placeholder="例: ¥30,000/month × 30クライアント" />
      </Field>
      <Field label={`💰 マネタイズ開始月: ${MONTHS[monetizeAt]}`}>
        <input type="range" min={0} max={TOTAL-1} value={monetizeAt} onChange={e => setMonetizeAt(e.target.value)}
          style={{ width:"100%", accentColor:"#c9a8e0" }} />
      </Field>

      <Field label="フェーズ">
        {phases.map((ph, i) => (
          <div key={ph.id} style={{ background:"#0b0b14", border:"1px solid #1e1e2e", borderRadius:8, padding:12, marginBottom:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div style={{ fontSize:10, color:"#666" }}>フェーズ {i+1}</div>
              {phases.length > 1 && (
                <button onClick={() => removePhase(ph.id)} style={{ background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:12 }}>✕</button>
              )}
            </div>
            <input style={{ ...inputStyle, marginBottom:8 }} value={ph.label} onChange={e => updatePhase(ph.id,"label",e.target.value)} placeholder="フェーズ名" />
            <div style={{ fontSize:9, color:"#888", marginBottom:4 }}>開始: {MONTHS[ph.start]}</div>
            <input type="range" min={0} max={TOTAL-1} value={ph.start} onChange={e => updatePhase(ph.id,"start",Number(e.target.value))}
              style={{ width:"100%", accentColor:color, marginBottom:8 }} />
            <div style={{ fontSize:9, color:"#888", marginBottom:4 }}>終了: {MONTHS[Math.min(ph.end, TOTAL-1)]}</div>
            <input type="range" min={ph.start+1} max={TOTAL} value={ph.end} onChange={e => updatePhase(ph.id,"end",Number(e.target.value))}
              style={{ width:"100%", accentColor:color, marginBottom:8 }} />
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <input type="checkbox" checked={ph.done} onChange={e => updatePhase(ph.id,"done",e.target.checked)} style={{ accentColor:"#4a8a4a" }} />
              <span style={{ fontSize:10, color:"#888" }}>完了済</span>
            </div>
          </div>
        ))}
        <button onClick={addPhase} style={{
          width:"100%", padding:"8px 0", background:"#0b0b14", border:"1px dashed #2a2a3e",
          borderRadius:6, color:"#666", cursor:"pointer", fontSize:11, fontFamily:"'Space Mono',monospace",
        }}>+ フェーズを追加</button>
      </Field>

      <div style={{ display:"flex", gap:8, marginTop:8 }}>
        <button onClick={onCancel} style={{
          flex:1, padding:"10px 0", background:"#0b0b14", border:"1px solid #2a2a3e",
          borderRadius:6, color:"#666", cursor:"pointer", fontSize:11, fontFamily:"'Space Mono',monospace",
        }}>キャンセル</button>
        <button onClick={handleSave} style={{
          flex:2, padding:"10px 0", background:"#c9a8e033", border:"1px solid #c9a8e0",
          borderRadius:6, color:"#c9a8e0", cursor:"pointer", fontSize:11, fontFamily:"'Space Mono',monospace",
        }}>{ isEdit ? "保存" : "追加" }</button>
      </div>
    </>
  );
}

// ---- Draggable phase bar ----
function PhaseBar({ phase, color, totalMonths, barWidth, onUpdate }) {
  const dragRef = useRef(null);

  const startDrag = (e, type) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startVal = type === "move" ? { start: phase.start, end: phase.end } : type === "left" ? phase.start : phase.end;
    const monthPx = barWidth / totalMonths;

    const onMove = (me) => {
      const dx = me.clientX - startX;
      const delta = Math.round(dx / monthPx);
      if (type === "move") {
        const dur = startVal.end - startVal.start;
        let ns = Math.max(0, Math.min(startVal.start + delta, totalMonths - dur));
        onUpdate({ start: ns, end: ns + dur });
      } else if (type === "left") {
        const ns = Math.max(0, Math.min(startVal + delta, phase.end - 1));
        onUpdate({ start: ns });
      } else {
        const ne = Math.max(phase.start + 1, Math.min(startVal + delta, totalMonths));
        onUpdate({ end: ne });
      }
    };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const left = `${(phase.start / totalMonths) * 100}%`;
  const width = `${((phase.end - phase.start) / totalMonths) * 100}%`;

  return (
    <div
      onMouseDown={e => startDrag(e, "move")}
      style={{
        position:"absolute", left, width,
        top:"50%", transform:"translateY(-50%)",
        height:20, borderRadius:4,
        background: phase.done ? "#1c1c28" : `${color}1e`,
        border: phase.done ? "1px dashed #2e2e3e" : `1px solid ${color}88`,
        display:"flex", alignItems:"center",
        cursor:"grab", userSelect:"none", overflow:"hidden",
      }}
    >
      {/* left handle */}
      <div onMouseDown={e => startDrag(e,"left")} style={{
        width:6, height:"100%", cursor:"ew-resize", flexShrink:0,
        background:`${color}33`, display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <div style={{ width:1, height:10, background:color, opacity:0.4 }} />
      </div>
      <span style={{ flex:1, fontSize:7, color: phase.done ? "#3a3a4a" : color, whiteSpace:"nowrap", overflow:"hidden", paddingLeft:3 }}>
        {phase.done ? "✓ " : ""}{phase.label}
      </span>
      {/* right handle */}
      <div onMouseDown={e => startDrag(e,"right")} style={{
        width:6, height:"100%", cursor:"ew-resize", flexShrink:0,
        background:`${color}33`, display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <div style={{ width:1, height:10, background:color, opacity:0.4 }} />
      </div>
    </div>
  );
}

// ---- Main ----
export default function GanttApp() {
  const [projects, setProjects] = useState(null);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null); // null | "add" | "edit"
  const [editTarget, setEditTarget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const barRef = useRef(null);
  const [barWidth, setBarWidth] = useState(600);

  // ストレージからロード
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("gantt-projects");
        setProjects(res ? JSON.parse(res.value) : DEFAULT_PROJECTS);
      } catch {
        setProjects(DEFAULT_PROJECTS);
      }
    })();
  }, []);

  // バー幅を計測
  useEffect(() => {
    if (!barRef.current) return;
    const obs = new ResizeObserver(entries => setBarWidth(entries[0].contentRect.width));
    obs.observe(barRef.current);
    return () => obs.disconnect();
  }, [projects]);

  const save = useCallback(async (next) => {
    setProjects(next);
    try { await window.storage.set("gantt-projects", JSON.stringify(next)); } catch {}
  }, []);

  const handleAddProject = (proj) => { save([...(projects||[]), proj]); setModal(null); };
  const handleEditProject = (proj) => { save((projects||[]).map(p => p.id === proj.id ? proj : p)); setModal(null); setEditTarget(null); };
  const handleDelete = (id) => { save((projects||[]).filter(p => p.id !== id)); setDeleteConfirm(null); if (selected === id) setSelected(null); };

  const updatePhase = (projId, phaseId, changes) => {
    save((projects||[]).map(p => p.id !== projId ? p : {
      ...p, phases: p.phases.map(ph => ph.id !== phaseId ? ph : { ...ph, ...changes })
    }));
  };

  const toggleDone = (projId, phaseId) => {
    save((projects||[]).map(p => p.id !== projId ? p : {
      ...p, phases: p.phases.map(ph => ph.id !== phaseId ? ph : { ...ph, done: !ph.done })
    }));
  };

  if (!projects) return (
    <div style={{ background:"#0b0b0f", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:"#555", fontFamily:"'Space Mono',monospace", fontSize:11 }}>
      Loading...
    </div>
  );

  const selectedProject = projects.find(p => p.id === selected);

  return (
    <div style={{ background:"#0b0b0f", minHeight:"100vh", fontFamily:"'Space Mono',monospace", color:"#e8e0f0", padding:"32px 28px", boxSizing:"border-box" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=Space+Mono&display=swap');
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar{width:4px;height:4px} ::-webkit-scrollbar-track{background:#0b0b0f} ::-webkit-scrollbar-thumb{background:#2a2a3e;border-radius:2px}
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28, flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:9, letterSpacing:4, color:"#c9a8e0", marginBottom:6, textTransform:"uppercase" }}>YUMIMIL · PROJECT CONTROL</div>
          <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:28, fontWeight:300, letterSpacing:2, color:"#f5f0ff" }}>Gantt Roadmap</div>
          <div style={{ fontSize:9, color:"#444", marginTop:4 }}>3月 → 11月 · {projects.length} projects · ドラッグで期間調整</div>
        </div>
        <button onClick={() => { setEditTarget(null); setModal("add"); }} style={{
          padding:"10px 18px", background:"#c9a8e011", border:"1px solid #c9a8e055",
          borderRadius:8, color:"#c9a8e0", cursor:"pointer", fontSize:10,
          fontFamily:"'Space Mono',monospace", letterSpacing:1,
        }}>+ プロジェクト追加</button>
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:20, marginBottom:20, flexWrap:"wrap" }}>
        {["HIGH","MED","LOW"].map(p => (
          <div key={p} style={{ display:"flex", alignItems:"center", gap:5, fontSize:8, color:"#666" }}>
            <div style={{ width:6, height:6, borderRadius:2, background: PRIORITY_COLOR[p] }} />{PRIORITY_LABEL[p]}
          </div>
        ))}
        <div style={{ fontSize:8, color:"#555" }}>← → ドラッグで移動 · 端を引っ張って期間変更 · ✓クリックで完了</div>
      </div>

      {/* Month headers */}
      <div style={{ display:"flex", marginLeft:180, marginBottom:4 }} ref={barRef}>
        {MONTHS.slice(0,TOTAL+1).map((m,i) => (
          <div key={i} style={{
            flex:1, fontSize:8, textAlign:"center",
            color: i === 0 ? "#c9a8e0" : "#333",
            borderLeft:"1px solid #1a1a24", paddingBottom:4,
          }}>{m}{i===0&&<span style={{ display:"block",fontSize:6,color:"#c9a8e0" }}>NOW</span>}</div>
        ))}
      </div>

      {/* Rows */}
      <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
        {projects.map(proj => (
          <div key={proj.id} style={{ display:"flex", alignItems:"center" }}>
            {/* Label */}
            <div style={{ width:180, paddingRight:10, flexShrink:0, display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background: PRIORITY_COLOR[proj.priority], flexShrink:0 }} />
                  <span
                    onClick={() => setSelected(selected === proj.id ? null : proj.id)}
                    style={{ fontSize:11, fontWeight:"bold", color:proj.color, cursor:"pointer", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}
                  >{proj.name}</span>
                </div>
                <div style={{ fontSize:7, color:"#444", marginLeft:10, marginTop:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{proj.desc}</div>
              </div>
              <div style={{ display:"flex", gap:4, flexShrink:0 }}>
                <button onClick={() => { setEditTarget(proj); setModal("edit"); }} style={{ background:"none", border:"none", color:"#444", cursor:"pointer", fontSize:10, padding:2 }} title="編集">✎</button>
                <button onClick={() => setDeleteConfirm(proj.id)} style={{ background:"none", border:"none", color:"#3a2a2a", cursor:"pointer", fontSize:10, padding:2 }} title="削除">✕</button>
              </div>
            </div>

            {/* Bar area */}
            <div style={{ flex:1, position:"relative", height:32 }}>
              {Array.from({length:TOTAL+1}).map((_,i) => (
                <div key={i} style={{ position:"absolute", left:`${(i/TOTAL)*100}%`, top:0, bottom:0, borderLeft:"1px solid #141420" }} />
              ))}
              {proj.phases.map(ph => (
                <PhaseBar
                  key={ph.id} phase={ph} color={proj.color}
                  totalMonths={TOTAL} barWidth={barWidth}
                  onUpdate={changes => updatePhase(proj.id, ph.id, changes)}
                />
              ))}
              {proj.monetizeAt <= TOTAL && (
                <div style={{ position:"absolute", left:`${(proj.monetizeAt/TOTAL)*100}%`, top:"50%", transform:"translate(-50%,-50%)", fontSize:12, opacity:0.7 }}>💰</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {selectedProject && (
        <div style={{ marginTop:24, padding:"18px 22px", background:"#0e0e18", border:`1px solid ${selectedProject.color}33`, borderRadius:10, animation:"fadeIn 0.2s ease" }}>
          <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:10, marginBottom:14 }}>
            <div>
              <div style={{ fontFamily:"Georgia,serif", fontSize:17, color:selectedProject.color, marginBottom:2 }}>{selectedProject.name}</div>
              <div style={{ fontSize:9, color:"#666" }}>{selectedProject.desc}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:8, color:"#555", marginBottom:2 }}>マネタイズ目標</div>
              <div style={{ fontSize:10, color:"#f0c4d4" }}>{selectedProject.monetize || "—"}</div>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {selectedProject.phases.map((ph,i) => (
              <div key={ph.id} style={{ display:"flex", alignItems:"center", gap:8, fontSize:10 }}>
                <div
                  onClick={() => toggleDone(selectedProject.id, ph.id)}
                  style={{
                    width:16, height:16, borderRadius:3, flexShrink:0, cursor:"pointer",
                    background: ph.done ? "#1a2e1a" : `${selectedProject.color}22`,
                    border: ph.done ? "1px solid #2a4a2a" : `1px solid ${selectedProject.color}55`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:8, color: ph.done ? "#4a8a4a" : selectedProject.color,
                    transition:"all 0.15s",
                  }}
                >{ph.done ? "✓" : i+1}</div>
                <span style={{ color: ph.done ? "#444" : "#ccc" }}>
                  {ph.label}
                  <span style={{ color:"#444", marginLeft:6, fontSize:8 }}>{MONTHS[ph.start]}〜{MONTHS[Math.min(ph.end, MONTHS.length-1)]}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <Modal title="削除の確認" onClose={() => setDeleteConfirm(null)}>
          <div style={{ fontSize:11, color:"#aaa", marginBottom:20 }}>
            「{projects.find(p=>p.id===deleteConfirm)?.name}」を削除しますか？
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => setDeleteConfirm(null)} style={{ flex:1, padding:"9px 0", background:"#0b0b14", border:"1px solid #2a2a3e", borderRadius:6, color:"#666", cursor:"pointer", fontSize:11, fontFamily:"'Space Mono',monospace" }}>キャンセル</button>
            <button onClick={() => handleDelete(deleteConfirm)} style={{ flex:1, padding:"9px 0", background:"#2a1414", border:"1px solid #5a2a2a", borderRadius:6, color:"#e07070", cursor:"pointer", fontSize:11, fontFamily:"'Space Mono',monospace" }}>削除</button>
          </div>
        </Modal>
      )}

      {/* Add / Edit modal */}
      {modal === "add" && (
        <Modal title="新規プロジェクト" onClose={() => setModal(null)}>
          <ProjectForm onSave={handleAddProject} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal === "edit" && editTarget && (
        <Modal title="プロジェクトを編集" onClose={() => { setModal(null); setEditTarget(null); }}>
          <ProjectForm initial={editTarget} onSave={handleEditProject} onCancel={() => { setModal(null); setEditTarget(null); }} />
        </Modal>
      )}

      <div style={{ marginTop:32, fontSize:7, color:"#222", textAlign:"center" }}>YUMIMIL INTERNAL · データはブラウザに保存されます</div>
    </div>
  );
}
