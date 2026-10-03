import { itemRoutes } from "@/lib/api/crud-routes";
import { updateProjectSchema } from "@/schemas/portfolio";
import { getProjectService } from "@/services/container";

export const { GET, PATCH, DELETE } = itemRoutes(getProjectService, updateProjectSchema);
