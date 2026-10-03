import { itemRoutes } from "@/lib/api/crud-routes";
import { updateExperienceSchema } from "@/schemas/portfolio";
import { getExperienceService } from "@/services/container";

export const { GET, PATCH, DELETE } = itemRoutes(getExperienceService, updateExperienceSchema);
