import { InMemoryCrudRepository } from "@/lib/crud";
import type { CreateContactInput } from "@/schemas/contact";
import type { ContactDTO } from "@/types/opportunity";

const n = <T>(v: T | undefined) => v ?? null;

/** What a new demo profile finds in its address book. */
export const DEMO_CONTACTS = [
  { name: "Jean-Marc Kouakou", email: null, title: "IT Manager", company: "SEHIN GROUP" },
  { name: "Marlène Kouakou", email: null, title: "Product Owner", company: "AGL" },
  { name: "Boris N'Guessan", email: null, title: "Lead Developer", company: "Microsoft" },
  { name: "Esther Konan", email: null, title: "Consultante", company: "Indépendante" },
] as const;

export const createMemoryContacts = (seedProfileId?: string) =>
  new InMemoryCrudRepository<ContactDTO, CreateContactInput, CreateContactInput>(
    seedProfileId,
    () => DEMO_CONTACTS.map((c) => ({ ...c })),
    (i) => ({ name: i.name, email: n(i.email), title: n(i.title), company: n(i.company) }),
  );
