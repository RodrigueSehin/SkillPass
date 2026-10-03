import { collectionRoutes } from "@/lib/api/crud-routes";
import { createProjectSchema } from "@/schemas/portfolio";
import { getProjectService } from "@/services/container";

export const { GET, POST } = collectionRoutes(getProjectService, createProjectSchema);
