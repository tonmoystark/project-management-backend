import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowRight, Calendar, Users } from "lucide-react";

import type { ProjectListItem } from "@/api/project.api";
import { RoleBadge } from "@/components/ui/RoleBadge";

interface ProjectCardProps {
  item: ProjectListItem;
}

export const ProjectCard = ({ item }: ProjectCardProps) => {
  const { project, role } = item;

  return (
    <Link
      to={`/projects/${project._id}/tasks`}
      className="group flex flex-col justify-between rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-base font-semibold tracking-tight group-hover:text-primary">
            {project.name}
          </h3>
          <RoleBadge role={role} className="shrink-0" />
        </div>

        <p className="mt-2 line-clamp-2 min-h-10 text-sm text-muted-foreground">
          {project.description || "No description provided."}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-3.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {project.members} {project.members === 1 ? "member" : "members"}
          </span>
          {project.createdAt && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(project.createdAt), "MMM d, yyyy")}
            </span>
          )}
        </div>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
    </Link>
  );
};
