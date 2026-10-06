import { z } from "zod";

const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optionalText = (max: number) => z.preprocess(blankToUndefined, z.string().trim().max(max).optional());

export const createContactSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(100),
  email: z.preprocess(blankToUndefined, z.string().trim().email("E-mail invalide").max(200).optional()),
  title: optionalText(120),
  company: optionalText(120),
});

export const updateContactSchema = createContactSchema;
export type CreateContactInput = z.infer<typeof createContactSchema>;
