import { useState, useCallback, useEffect } from "react";
import { supabase } from "./Supabase";
import "./App.css";

import type { Task, ColumnId, PriorityId, TeamMember, LabelOption, NewTaskForm } from "./types";
import { COLUMNS, PRIORITIES, TEAM_COLORS, BLANK_TASK, LABEL_COLORS } from "./constants";
import { apiFetch } from "./api/client";
import { useDragAndDrop } from "./hooks/useDragAndDrop";

import { Dropdown } from "./components/Dropdown";
import { TaskCard } from "./components/TaskCard";
import { CreateTaskModal } from "./components/modals/CreateTaskModal";
import { DetailModal } from "./components/modals/DetailModal";
import { TeamModal } from "./components/modals/TeamModal";
import { LabelsModal } from "./components/modals/LabelsModal";

export default function KanbanApp() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [labelOptions, setLabelOptions] = useState<LabelOption[]>([]);

  const [search, setSearch] = useState("");
  const [fPri, setFPri] = useState<PriorityId | "all">("all");
  const [fAsgn, setFAsgn] = useState("all");
  const [fLbl, setFLbl] = useState("all");

  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [showTeam, setShowTeam] = useState(false);
  const [showLabels, setShowLabels] = useState(false);

  const [nTask, setNTask] = useState<NewTaskForm>(BLANK_TASK);
  const [nComment, setNComment] = useState("");
  const [nMember, setNMember] = useState("");
  const [nLabelName, setNLabelName] = useState("");
  const [nLabelColor, setNLabelColor] = useState(LABEL_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [detailTab, setDetailTab] = useState<"details" | "activity">("details");

  const { dragOverCol, draggingId, colRefs, startDrag, handleCardClick } = useDragAndDrop(tasks, setTasks, setError);

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let ignore = false;
    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          if (!ignore) loadData();
        } else {
          const { error: signInError } = await supabase.auth.signInAnonymously();
          if (signInError) throw signInError;
          if (!ignore) loadData();
        }
      } catch (err: unknown) {
        if (!ignore) setError((err as Error).message);
      }
    }
    initAuth();
    return () => { ignore = true; };
  }, []);

  // ── Load data ─────────────────────────────────────────────────────────────
  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [apiTasks, apiTeam, apiLabels] = await Promise.all([
        apiFetch<any[]>("/tasks"),
        apiFetch<any[]>("/team"),
        apiFetch<any[]>("/labels"),
      ]);

      const details = await Promise.all(
        apiTasks.map(t => Promise.all([
          apiFetch<any[]>(`/tasks/${t.id}/comments`),
          apiFetch<any[]>(`/tasks/${t.id}/activity`),
        ]))
      );

      setTasks(apiTasks.map((t, i) => {
        const [comments, activity] = details[i];
        return {
          id: t.id,
          title: t.title,
          description: t.description ?? "",
          status: t.status,
          priority: t.priority,
          labels: t.label_ids ?? [],
          assignees: t.assignees ?? [],
          dueDate: t.due_date ?? "",
          comments: comments.map((c: any) => ({ id: c.id, author: c.user_id, text: c.text, at: c.created_at })),
          activity: activity.map((a: any) => ({ type: a.type, at: a.created_at, text: a.text })),
          createdAt: t.created_at,
        };
      }));

      setTeam(apiTeam.map((m: any) => ({ id: m.id, name: m.name, color: m.color })));
      setLabelOptions(apiLabels.map((l: any) => ({ id: l.id, label: l.label, color: l.color })));
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (fPri !== "all" && t.priority !== fPri) return false;
    if (fAsgn !== "all" && !t.assignees.includes(fAsgn)) return false;
    if (fLbl !== "all" && !t.labels.includes(fLbl)) return false;
    return true;
  });

  const colTasks = (id: ColumnId) => filtered.filter(t => t.status === id);
  const total = tasks.length;
  const done = tasks.filter(t => t.status === "done").length;
  const inProg = tasks.filter(t => t.status === "in_progress").length;
  const overdue = tasks.filter(t =>
    t.dueDate && t.status !== "done" &&
    new Date(t.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0)
  ).length;

  const statItems = [
    { label: "Total", val: total },
    { label: "In Progress", val: inProg },
    { label: "Completed", val: done },
    ...(overdue > 0 ? [{ label: "Overdue", val: overdue, red: true }] : []),
  ];

  // ── Handlers ──────────────────────────────────────────────────────────────
  const doCreate = async () => {
    if (!nTask.title.trim()) return;
    setSaving(true);
    try {
      const row = await apiFetch<any>("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: nTask.title.trim(),
          description: nTask.description,
          status: nTask.status,
          priority: nTask.priority,
          due_date: nTask.dueDate || null,
          assignees: nTask.assignees,
          label_ids: nTask.labels,
        }),
      });
      setTasks(prev => [{
        id: row.id,
        title: row.title,
        description: row.description ?? "",
        status: row.status,
        priority: row.priority,
        labels: row.label_ids ?? [],
        assignees: row.assignees ?? [],
        dueDate: row.due_date ?? "",
        comments: [],
        activity: [{ type: "created", at: new Date().toISOString(), text: "Task created" }],
        createdAt: row.created_at,
      }, ...prev]);
      setNTask(BLANK_TASK);
      setShowCreate(false);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const doComment = async (tid: string) => {
    if (!nComment.trim()) return;
    try {
      const c = await apiFetch<any>(`/tasks/${tid}/comments`, {
        method: "POST",
        body: JSON.stringify({ text: nComment.trim() }),
      });
      setTasks(prev => prev.map(t =>
        t.id !== tid ? t : {
          ...t,
          comments: [...t.comments, { id: c.id, author: c.user_id, text: c.text, at: c.created_at }],
          activity: [...t.activity, { type: "comment" as const, at: new Date().toISOString(), text: "Comment added" }],
        }
      ));
      setNComment("");
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  const doAddMember = async () => {
    if (!nMember.trim()) return;
    try {
      const color = TEAM_COLORS[team.length % TEAM_COLORS.length];
      const m = await apiFetch<any>("/team", {
        method: "POST",
        body: JSON.stringify({ name: nMember.trim(), color }),
      });
      setTeam(prev => [...prev, { id: m.id, name: m.name, color: m.color }]);
      setNMember("");
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  const doRemoveMember = async (memberId: string) => {
    try {
      await apiFetch(`/team/${memberId}`, { method: "DELETE" });
      setTeam(prev => prev.filter(m => m.id !== memberId));
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  const doAddLabel = async () => {
    if (!nLabelName.trim()) return;
    try {
      const l = await apiFetch<any>("/labels", {
        method: "POST",
        body: JSON.stringify({ label: nLabelName.trim(), color: nLabelColor }),
      });
      setLabelOptions(prev => [...prev, { id: l.id, label: l.label, color: l.color }]);
      setNLabelName("");
      setNLabelColor(LABEL_COLORS[0]);
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  const doDeleteLabel = async (labelId: string) => {
    try {
      await apiFetch(`/labels/${labelId}`, { method: "DELETE" });
      setLabelOptions(prev => prev.filter(l => l.id !== labelId));
      setTasks(prev => prev.map(t => ({ ...t, labels: t.labels.filter(l => l !== labelId) })));
      if (fLbl === labelId) setFLbl("all");
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  const doDeleteTask = async (taskId: string) => {
    try {
      await apiFetch(`/tasks/${taskId}`, { method: "DELETE" });
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setShowDetail(null);
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  const updateTaskField = async <K extends keyof Task>(id: string, key: K, value: Task[K]) => {
    setTasks(prev => prev.map(t => t.id !== id ? t : { ...t, [key]: value }));
    const colMap: Partial<Record<keyof Task, string>> = {
      status: "status", priority: "priority", dueDate: "due_date",
      description: "description", title: "title", labels: "label_ids", assignees: "assignees",
    };
    const dbCol = colMap[key];
    if (!dbCol) return;
    const dbVal = key === "dueDate" ? (value as string) || null : value;
    try {
      await apiFetch(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ [dbCol]: dbVal }) });
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  const moveTask = async (taskId: string, newStatus: ColumnId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const oc = COLUMNS.find(c => c.id === task.status);
    const nc = COLUMNS.find(c => c.id === newStatus);
    const logText = `Moved from ${oc?.label} → ${nc?.label}`;
    setTasks(prev => prev.map(t =>
      t.id !== taskId ? t : {
        ...t, status: newStatus,
        activity: [...t.activity, { type: "moved" as const, at: new Date().toISOString(), text: logText }],
      }
    ));
    try {
      await apiFetch(`/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  const openDetail = useCallback((id: string) => {
    setDetailTab("details");
    setShowDetail(id);
  }, []);

  const detailTask = showDetail ? tasks.find(t => t.id === showDetail) ?? null : null;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", flexDirection: "column", gap: 16,
        background: "var(--bg)", color: "var(--text2)",
      }}>
        <div style={{
          width: 36, height: 36, border: "3px solid var(--border)",
          borderTopColor: "var(--accent)", borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <span style={{ fontSize: 14 }}>Connecting…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {error && (
        <div style={{
          position: "fixed", top: 16, right: 16, zIndex: 9999,
          background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
          color: "#ef4444", borderRadius: 10, padding: "10px 16px",
          fontSize: 13, display: "flex", gap: 12, alignItems: "center",
          maxWidth: 360, backdropFilter: "blur(10px)",
        }}>
          <span style={{ flex: 1 }}>⚠ {error}</span>
          <button onClick={() => setError(null)}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 16 }}>×</button>
        </div>
      )}

      <div className="app">

        {/* Header */}
        <div className="hdr">
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div className="logo">Task Board</div>
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              {statItems.map((s, i) => (
                <div key={s.label} style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "0 16px",
                  borderLeft: i > 0 ? "1px solid rgba(120,200,255,0.1)" : "none",
                }}>
                  <span style={{ fontSize: 12, color: "var(--text3)" }}>{s.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: s.red ? "#e05555" : "var(--text)" }}>{s.val}</span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", borderLeft: "1px solid rgba(120,200,255,0.1)" }}>
                <div style={{ width: 60, height: 3, background: "var(--bg4)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${total > 0 ? (done/total)*100 : 0}%`, background: "var(--accent)", borderRadius: 99, transition: "width .4s" }} />
                </div>
                <span style={{ fontSize: 12, color: "var(--text3)", whiteSpace: "nowrap" }}>
                  {total > 0 ? Math.round((done/total)*100) : 0}%
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="btn btn-g btn-labels" onClick={() => setShowLabels(true)}>Labels</button>
            <button className="btn btn-g" onClick={() => setShowTeam(true)}>Team</button>
            <button className="btn btn-p" onClick={() => setShowCreate(true)}>+ New Task</button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="sw">
            <svg className="si" width="14" height="14" fill="none" viewBox="0 0 16 16">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input className="sinp" placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Dropdown value={fPri} onChange={v => setFPri(v as PriorityId | "all")}
            options={[{ value: "all", label: "All Priorities" }, ...PRIORITIES.map(p => ({ value: p.id, label: p.label }))]} />
          <Dropdown value={fAsgn} onChange={setFAsgn}
            options={[{ value: "all", label: "All Assignees" }, ...team.map(m => ({ value: m.id, label: m.name }))]} />
          <Dropdown value={fLbl} onChange={setFLbl}
            options={[{ value: "all", label: "All Labels" }, ...labelOptions.map(l => ({ value: l.id, label: l.label }))]} />
        </div>

        {/* Board */}
        <div className="board">
          {COLUMNS.map(col => {
            const ct = colTasks(col.id);
            return (
              <div key={col.id} className="col">
                <div className="col-hdr">
                  <span className="col-title">{col.label}</span>
                  <span className="col-cnt">{ct.length}</span>
                </div>
                <div
                  className={`col-body${dragOverCol === col.id ? " over" : ""}`}
                  ref={el => { colRefs.current[col.id] = el; }}
                >
                  {ct.length === 0 && (
                    <div className="col-empty">
                      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      Drop tasks here
                    </div>
                  )}
                  {ct.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      team={team}
                      labelOptions={labelOptions}
                      ghost={draggingId === task.id}
                      onPointerDown={e => startDrag(e, task.id)}
                      onClick={() => handleCardClick(task.id, openDetail)}
                    />
                  ))}
                </div>
                <button className="add-btn"
                  onClick={() => { setNTask(n => ({ ...n, status: col.id })); setShowCreate(true); }}>
                  <svg width="12" height="12" fill="none" viewBox="0 0 12 12">
                    <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Add task
                </button>
              </div>
            );
          })}
        </div>

        {/* Modals */}
        {showCreate && (
          <CreateTaskModal
            nTask={nTask} setNTask={setNTask} saving={saving}
            team={team} labelOptions={labelOptions}
            onClose={() => setShowCreate(false)} onCreate={doCreate}
          />
        )}

        {detailTask && (
          <DetailModal
            task={detailTask} team={team} labelOptions={labelOptions}
            detailTab={detailTab} setDetailTab={setDetailTab}
            nComment={nComment} setNComment={setNComment}
            onClose={() => setShowDetail(null)}
            onDelete={doDeleteTask}
            onComment={doComment}
            onMove={moveTask}
            onUpdateField={updateTaskField}
          />
        )}

        {showTeam && (
          <TeamModal
            team={team} nMember={nMember} setNMember={setNMember}
            onClose={() => setShowTeam(false)} onAdd={doAddMember} onRemove={doRemoveMember}
          />
        )}

        {showLabels && (
          <LabelsModal
            labelOptions={labelOptions} tasks={tasks}
            nLabelName={nLabelName} setNLabelName={setNLabelName}
            nLabelColor={nLabelColor} setNLabelColor={setNLabelColor}
            onClose={() => setShowLabels(false)} onAdd={doAddLabel} onDelete={doDeleteLabel}
          />
        )}
      </div>
    </>
  );
}