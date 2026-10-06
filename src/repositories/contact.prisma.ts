import { prisma } from "@/lib/db/prisma";
import type { CrudRepository } from "@/lib/crud";
import type { CreateContactInput } from "@/schemas/contact";
import type { ContactDTO } from "@/types/opportunity";

const toContact = (r: {
  id: string;
  name: string;
  email: string | null;
  title: string | null;
  company: string | null;
}): ContactDTO => ({ id: r.id, name: r.name, email: r.email, title: r.title, company: r.company });

const data = (i: CreateContactInput) => ({
  name: i.name,
  email: i.email ?? null,
  title: i.title ?? null,
  company: i.company ?? null,
});

export class PrismaContactRepository implements CrudRepository<
  ContactDTO,
  CreateContactInput,
  CreateContactInput
> {
  async list(profileId: string) {
    const rows = await prisma.contact.findMany({ where: { profileId }, orderBy: { name: "asc" } });
    return rows.map(toContact);
  }

  async findById(profileId: string, id: string) {
    const row = await prisma.contact.findFirst({ where: { id, profileId } });
    return row ? toContact(row) : null;
  }

  async create(profileId: string, input: CreateContactInput) {
    return toContact(await prisma.contact.create({ data: { profileId, ...data(input) } }));
  }

  async update(profileId: string, id: string, input: CreateContactInput) {
    const { count } = await prisma.contact.updateMany({ where: { id, profileId }, data: data(input) });
    return count === 0 ? null : this.findById(profileId, id);
  }

  async remove(profileId: string, id: string) {
    const { count } = await prisma.contact.deleteMany({ where: { id, profileId } });
    return count > 0;
  }
}
