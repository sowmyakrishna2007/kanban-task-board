import { useState, useRef, useCallback, useEffect } from "react";
import type { ColumnId, Task, DragState } from "../types";
import { COLUMNS } from "../constants";
import { apiFetch } from "../api/client";

/**
 * useDragAndDrop
 *
 * Custom hook that implements drag-and-drop for task cards using the
 * browser's native Pointer Events API — no external library required.
 *
 * How it works:
 *  1. onPointerDown on a card calls startDrag
 *  2. A drag clone (visual copy of the card) is created and follows the cursor
 *  3. Column refs are checked on every pointermove to detect which column
 *     the cursor is over, highlighting it with the "over" CSS class
 *  4. On pointerup, if the card was dropped on a different column, the task
 *     status is updated optimistically and a PATCH request is sent to the API
 *
 * Module-level variables (_drag, _dragMoved) are used instead of refs
 * so they can be read inside the raw DOM event listeners without stale closures.
 *
 * @param tasks     — current task list
 * @param setTasks  — updates the task list (used for optimistic status updates)
 * @param setError  — surfaces API errors to the global error banner
 */

// Module-level drag state — shared between pointermove and pointerup handlers.
// Using module scope avoids stale closure issues with useRef inside callbacks.
let _drag: DragState | null = null;
let _dragMoved = false;

export function useDragAndDrop(
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setError: (msg: string | null) => void,
) {
  const [dragOverCol, setDragOverCol] = useState<ColumnId | null>(null); // Column currently being hovered
  const [draggingId, setDraggingId]   = useState<string | null>(null);   // ID of the card being dragged

  // Refs to each column's DOM element — used for hit detection
  const colRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Ref to the drag clone element so it can be removed on drop or unmount
  const cloneEl = useRef<HTMLDivElement | null>(null);

  // Clean up the drag clone if the component unmounts mid-drag
  useEffect(() => () => { if (cloneEl.current) cloneEl.current.remove(); }, []);

  /**
   * startDrag
   *
   * Called on pointerdown on a task card. Sets up pointermove and pointerup
   * listeners on the document to track the drag.
   *
   * A 5px movement threshold prevents accidental drags when clicking.
   * Ignores pointer events that originate from interactive elements inside the card.
   */
  const startDrag = useCallback((e: React.PointerEvent<HTMLDivElement>, taskId: string) => {
    const target = e.target as HTMLElement;

    // Don't start a drag if the user clicked a button, input, etc. inside the card
    if (target.closest("button,input,textarea,select,a")) return;

    const card   = e.currentTarget;
    const rect   = card.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;

    _drag      = null;
    _dragMoved = false;

    // Create the drag clone — a simplified visual copy of the card that follows the cursor
    const clone = document.createElement("div");
    clone.className    = "drag-clone";
    clone.style.width  = rect.width + "px";
    clone.style.left   = rect.left + "px";
    clone.style.top    = rect.top + "px";
    clone.textContent  = card.querySelector(".card-title")?.textContent ?? "";

    const onMove = (mv: PointerEvent) => {
      if (_dragMoved) mv.preventDefault();

      const dx = mv.clientX - startX;
      const dy = mv.clientY - startY;

      // Only start the visual drag after the cursor has moved more than 5px
      if (!_dragMoved && Math.sqrt(dx*dx + dy*dy) > 5) {
        _dragMoved    = true;
        _drag         = { taskId, ox: mv.clientX - rect.left, oy: mv.clientY - rect.top };
        clone.style.width = rect.width + "px";
        document.body.appendChild(clone);
        cloneEl.current = clone;
        setDraggingId(taskId); // Fades out the original card
      }

      if (!_dragMoved || !cloneEl.current || !_drag) return;

      // Move the clone to follow the cursor, offset by where the user grabbed it
      cloneEl.current.style.left = mv.clientX - _drag.ox + "px";
      cloneEl.current.style.top  = mv.clientY - _drag.oy + "px";

      // Auto-scroll the board when the cursor reaches the edges
      const board = document.querySelector(".board") as HTMLElement;
      if (board) {
        const br       = board.getBoundingClientRect();
        const edgeSize = 80;
        const speed    = 12;
        if (window.innerWidth <= 768) {
          // Mobile — vertical scroll
          if (mv.clientY < br.top + edgeSize)    board.scrollTop -= speed;
          if (mv.clientY > br.bottom - edgeSize) board.scrollTop += speed;
        } else {
          // Desktop — horizontal scroll
          if (mv.clientX < br.left + edgeSize)  board.scrollLeft -= speed;
          if (mv.clientX > br.right - edgeSize) board.scrollLeft += speed;
        }
      }

      // Hit test each column to determine which one the cursor is over
      let hit: ColumnId | null = null;
      for (const [cid, el] of Object.entries(colRefs.current)) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (mv.clientX >= r.left && mv.clientX <= r.right && mv.clientY >= r.top && mv.clientY <= r.bottom) {
          hit = cid as ColumnId;
          break;
        }
      }
      setDragOverCol(hit);
    };

    const onUp = async (up: PointerEvent) => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);

      // Remove the drag clone from the DOM
      if (cloneEl.current) { cloneEl.current.remove(); cloneEl.current = null; }

      if (_dragMoved && _drag) {
        // Determine which column the card was dropped on
        let dropTarget: ColumnId | null = null;
        for (const [cid, el] of Object.entries(colRefs.current)) {
          if (!el) continue;
          const r = el.getBoundingClientRect();
          if (up.clientX >= r.left && up.clientX <= r.right && up.clientY >= r.top && up.clientY <= r.bottom) {
            dropTarget = cid as ColumnId;
            break;
          }
        }

        if (dropTarget) {
          const tid  = _drag.taskId;
          const task = tasks.find(t => t.id === tid);

          // Only update if the card was dropped on a different column
          if (task && task.status !== dropTarget) {
            const oc      = COLUMNS.find(c => c.id === task.status);
            const nc      = COLUMNS.find(c => c.id === dropTarget);
            const logText = `Moved from ${oc?.label} → ${nc?.label}`;

            // Optimistic update — move the card immediately before the API responds
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

      // Reset all drag state
      _drag = null;
      setDraggingId(null);
      setDragOverCol(null);
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }, [tasks, setTasks, setError]);

  /**
   * handleCardClick
   *
   * Called onClick on a task card. Only opens the detail modal if the
   * pointer didn't move (i.e. it was a tap/click, not a drag).
   *
   * @param taskId — ID of the clicked task
   * @param onOpen — callback to open the detail modal
   */
  const handleCardClick = useCallback((taskId: string, onOpen: (id: string) => void) => {
    if (!_dragMoved) onOpen(taskId);
  }, []);

  return { dragOverCol, draggingId, colRefs, startDrag, handleCardClick };
}