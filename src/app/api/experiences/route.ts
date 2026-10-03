import { collectionRoutes } from "@/lib/api/crud-routes";
import { createExperienceSchema } from "@/schemas/portfolio";
import { getExperienceService } from "@/services/container";

export const { GET, POST } = collectionRoutes(getExperienceService, createExperienceSchema);
