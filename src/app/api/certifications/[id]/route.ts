import { itemRoutes } from "@/lib/api/crud-routes";
import { updateCertificationSchema } from "@/schemas/portfolio";
import { getCertificationService } from "@/services/container";

export const { GET, PATCH, DELETE } = itemRoutes(getCertificationService, updateCertificationSchema);
