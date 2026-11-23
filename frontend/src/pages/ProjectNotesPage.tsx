import { useMemo, useState } from "react";
import { AlertCircle, Plus, Search, StickyNote } from "lucide-react";

import type { Note } from "@/api/note.api";
import { getApiErrorMessage } from "@/api/axios";
import { useDeleteNote, useNotes } from "@/hooks/useNotes";
import { useProjectWorkspace } from "@/components/projects/ProjectWorkspaceLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { NoteCard } from "@/components/notes/NoteCard";
import { NoteFormModal } from "@/components/notes/NoteFormModal";

const ProjectNotesPage = () => {
  const { project } = useProjectWorkspace();

  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  const {
    data: notes,
    isLoading,
    isError,
    error,
    refetch,
  } = useNotes(project._id);
  const deleteNote = useDeleteNote(project._id);

  const filteredNotes = useMemo(() => {
    if (!notes) return [];
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return notes;
    return notes.filter((note) =>
      note.title.toLowerCase().includes(normalized),
    );
  }, [notes, searchQuery]);

  const openCreateModal = () => {
    setEditingNote(null);
    setIsFormOpen(true);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingNote(null);
  };

  const handleConfirmDelete = () => {
    if (!noteToDelete) return;
    deleteNote.mutate(noteToDelete._id, {
      onSuccess: () => setNoteToDelete(null),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">My Notes</h2>
          <p className="text-sm text-muted-foreground">
            Private notes you&apos;ve created for {project.name}.
          </p>
        </div>

        <Button type="button" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          New Note
        </Button>
      </div>

      {notes && notes.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your notes..."
            className="pl-9"
          />
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-xl border border-border bg-card p-5"
            >
              <div className="h-4 w-full rounded bg-muted" />
              <div className="mt-2 h-4 w-3/4 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <h3 className="text-base font-semibold">Failed to load notes</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {getApiErrorMessage(error, "Could not fetch your notes.")}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            className="mt-4"
          >
            Try again
          </Button>
        </div>
      ) : !notes || notes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <StickyNote className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <h3 className="text-base font-semibold">No notes yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Jot down quick reminders, meeting takeaways, or personal to-dos for
            this project.
          </p>
          <Button
            type="button"
            onClick={openCreateModal}
            className="mt-4"
          >
            <Plus className="h-4 w-4" />
            Create first note
          </Button>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No notes match &ldquo;{searchQuery}&rdquo;.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              onEdit={openEditModal}
              onDelete={setNoteToDelete}
            />
          ))}
        </div>
      )}

      <NoteFormModal
        projectId={project._id}
        open={isFormOpen}
        onClose={closeFormModal}
        note={editingNote}
      />

      <Modal
        open={Boolean(noteToDelete)}
        onClose={() => setNoteToDelete(null)}
        title="Delete note?"
        description="Are you sure you want to delete this note? This cannot be undone."
      >
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setNoteToDelete(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            isLoading={deleteNote.isPending}
            loadingText="Deleting..."
            onClick={handleConfirmDelete}
          >
            Delete note
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectNotesPage;
