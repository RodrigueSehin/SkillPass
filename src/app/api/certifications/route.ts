import { collectionRoutes } from "@/lib/api/crud-routes";
import { createCertificationSchema } from "@/schemas/portfolio";
import { getCertificationService } from "@/services/container";

export const { GET, POST } = collectionRoutes(getCertificationService, createCertificationSchema);
