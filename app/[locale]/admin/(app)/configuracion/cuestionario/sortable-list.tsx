"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import {
  QuestionForm,
  FIELD_TYPE_LABELS,
  type Question,
} from "./question-form";
import { deleteQuestion, reorderQuestions } from "./actions";

export function SortableQuestionsList({
  initial,
}: {
  initial: Question[];
}) {
  const [items, setItems] = useState(initial);
  const [pending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((q) => q.id === active.id);
    const newIndex = items.findIndex((q) => q.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    const ids = next.map((q) => q.id);
    startTransition(() => {
      reorderQuestions(ids);
    });
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-[color:var(--color-brand-muted)] text-center py-8">
        Sin preguntas aún. Crea la primera.
      </p>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((q) => q.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-2">
            {items.map((q) => (
              <SortableRow key={q.id} q={q} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {pending && (
        <p className="mt-3 text-xs text-[color:var(--color-brand-muted)] text-right">
          Guardando orden…
        </p>
      )}
    </>
  );
}

function SortableRow({ q }: { q: Question }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: q.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-3 p-3 sm:p-4 rounded-xl border bg-white transition ${
        isDragging
          ? "border-[color:var(--color-brand-green)] shadow-md z-10 relative"
          : "border-[color:var(--color-brand-ink)]/10"
      } ${q.is_active ? "" : "opacity-60"}`}
    >
      <button
        type="button"
        className="mt-1 cursor-grab active:cursor-grabbing text-[color:var(--color-brand-muted)] hover:text-[color:var(--color-brand-ink)] touch-none"
        {...attributes}
        {...listeners}
        aria-label="Reordenar"
      >
        <GripVertical size={16} />
      </button>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">
          {q.question_es}
          {q.is_required && (
            <span className="ml-2 text-[10px] text-[color:var(--color-brand-pink)] font-semibold uppercase tracking-wider">
              obligatoria
            </span>
          )}
          {!q.is_active && (
            <span className="ml-2 text-[10px] text-[color:var(--color-brand-muted)] uppercase tracking-wider">
              inactiva
            </span>
          )}
        </p>
        <p className="text-xs text-[color:var(--color-brand-muted)] mt-0.5">
          {FIELD_TYPE_LABELS[q.field_type]}
          {q.options && q.options.length > 0 && (
            <>
              {" "}
              · {q.options.length} opciones
            </>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <QuestionForm question={q} />
        <form action={deleteQuestion}>
          <input type="hidden" name="id" value={q.id} />
          <button
            type="submit"
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-[color:var(--color-brand-muted)] hover:text-[color:var(--color-brand-pink)] hover:bg-[color:var(--color-brand-pink-soft)]/30 transition"
            aria-label="Eliminar pregunta"
          >
            <Trash2 size={14} />
          </button>
        </form>
      </div>
    </li>
  );
}
