import { format } from "date-fns";
import { Calendar, Pencil, Trash2 } from "lucide-react";

import type { Note } from "@/api/note.api";
import { Button } from "@/components/ui/Button";

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export const NoteCard = ({ note, onEdit, onDelete }: NoteCardProps) => {
  const wasUpdated =
    note.updatedAt && note.createdAt && note.updatedAt !== note.createdAt;

  return (
    <article className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs transition-shadow hover:shadow-sm">
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {note.title}
      </p>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
        <div className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
          {note.createdAt && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(note.createdAt), "MMM d, yyyy · h:mm a")}
            </span>
          )}
          {wasUpdated && (
            <span>
              Edited {format(new Date(note.updatedAt), "MMM d, h:mm a")}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Edit note"
            onClick={() => onEdit(note)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Delete note"
            onClick={() => onDelete(note)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </article>
  );
};
