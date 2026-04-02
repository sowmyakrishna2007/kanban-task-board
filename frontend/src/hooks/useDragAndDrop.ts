import { useState, useRef, useCallback, useEffect } from "react";
import type { ColumnId, Task, DragState } from "../types";
import { COLUMNS } from "../constants";
import { apiFetch } from "../api/client";

let _drag: DragState | null = null;
let _dragMoved = false;

export function useDragAndDrop(
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setError: (msg: string | null) => void,
) {
  const [dragOverCol, setDragOverCol] = useState<ColumnId | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const colRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const cloneEl = useRef<HTMLDivElement | null>(null);

  useEffect(() => () => { if (cloneEl.current) cloneEl.current.remove(); }, []);

  const startDrag = useCallback((e: React.PointerEvent<HTMLDivElement>, taskId: string) => {
    const target = e.target as HTMLElement;
    if (target.closest("button,input,textarea,select,a")) return;

    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;

    _drag = null;
    _dragMoved = false;

    const clone = document.createElement("div");
    clone.className = "drag-clone";
    clone.style.width = rect.width + "px";
    clone.style.left = rect.left + "px";
    clone.style.top = rect.top + "px";
    clone.textContent = card.querySelector(".card-title")?.textContent ?? "";

    const onMove = (mv: PointerEvent) => {
      if (_dragMoved) mv.preventDefault();
      const dx = mv.clientX - startX, dy = mv.clientY - startY;
      if (!_dragMoved && Math.sqrt(dx*dx + dy*dy) > 5) {
        _dragMoved = true;
        _drag = { taskId, ox: mv.clientX - rect.left, oy: mv.clientY - rect.top };
        clone.style.width = rect.width + "px";
        document.body.appendChild(clone);
        cloneEl.current = clone;
        setDraggingId(taskId);
      }
      if (!_dragMoved || !cloneEl.current || !_drag) return;
      cloneEl.current.style.left = mv.clientX - _drag.ox + "px";
      cloneEl.current.style.top = mv.clientY - _drag.oy + "px";

      const board = document.querySelector(".board") as HTMLElement;
      if (board) {
        const br = board.getBoundingClientRect();
        const edgeSize = 80, speed = 12;
        if (window.innerWidth <= 768) {
          if (mv.clientY < br.top + edgeSize) board.scrollTop -= speed;
          if (mv.clientY > br.bottom - edgeSize) board.scrollTop += speed;
        } else {
          if (mv.clientX < br.left + edgeSize) board.scrollLeft -= speed;
          if (mv.clientX > br.right - edgeSize) board.scrollLeft += speed;
        }
      }

      let hit: ColumnId | null = null;
      for (const [cid, el] of Object.entries(colRefs.current)) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (mv.clientX >= r.left && mv.clientX <= r.right && mv.clientY >= r.top && mv.clientY <= r.bottom) {
          hit = cid as ColumnId; break;
        }
      }
      setDragOverCol(hit);
    };

    const onUp = async (up: PointerEvent) => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      if (cloneEl.current) { cloneEl.current.remove(); cloneEl.current = null; }

      if (_dragMoved && _drag) {
        let dropTarget: ColumnId | null = null;
        for (const [cid, el] of Object.entries(colRefs.current)) {
          if (!el) continue;
          const r = el.getBoundingClientRect();
          if (up.clientX >= r.left && up.clientX <= r.right && up.clientY >= r.top && up.clientY <= r.bottom) {
            dropTarget = cid as ColumnId; break;
          }
        }
        if (dropTarget) {
          const tid = _drag.taskId;
          const task = tasks.find(t => t.id === tid);
          if (task && task.status !== dropTarget) {
            const oc = COLUMNS.find(c => c.id === task.status);
            const nc = COLUMNS.find(c => c.id === dropTarget);
            const logText = `Moved from ${oc?.label} → ${nc?.label}`;
            setTasks(prev => prev.map(t =>
              t.id !== tid ? t : {
                ...t, status: dropTarget!,
                activity: [...t.activity, { type: "moved" as const, at: new Date().toISOString(), text: logText }],
              }
            ));
            try {
              await apiFetch(`/tasks/${tid}`, { method: "PATCH", body: JSON.stringify({ status: dropTarget }) });
            } catch (err: unknown) {
              setError((err as Error).message);
            }
          }
        }
      }

      _drag = null;
      setDraggingId(null);
      setDragOverCol(null);
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }, [tasks, setTasks, setError]);

  const handleCardClick = useCallback((taskId: string, onOpen: (id: string) => void) => {
    if (!_dragMoved) onOpen(taskId);
  }, []);

  return { dragOverCol, draggingId, colRefs, startDrag, handleCardClick };
}