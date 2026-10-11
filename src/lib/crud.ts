import { randomUUID } from "node:crypto";
import { NotFoundError } from "@/lib/errors";
import { assertWithinCapacity, type Capacity } from "@/lib/plans/limits";

/** Every method is scoped by profileId: a repository never touches another user's rows. */
export interface CrudRepository<Dto extends { id: string }, Create, Patch = Partial<Create>> {
  list(profileId: string): Promise<Dto[]>;
  findById(profileId: string, id: string): Promise<Dto | null>;
  create(profileId: string, input: Create): Promise<Dto>;
  update(profileId: string, id: string, patch: Patch): Promise<Dto | null>;
  remove(profileId: string, id: string): Promise<boolean>;
}

export class CrudService<Dto extends { id: string }, Create, Patch = Partial<Create>> {
  constructor(
    private readonly repo: CrudRepository<Dto, Create, Patch>,
    private readonly label: string,
    /** The plan's limit on how many items a profile may hold; none when omitted. */
    private readonly capacity?: Capacity,
  ) {}

  list(profileId: string) {
    return this.repo.list(profileId);
  }

  async get(profileId: string, id: string) {
    const item = await this.repo.findById(profileId, id);
    if (!item) throw new NotFoundError(`${this.label} introuvable`);
    return item;
  }

  async add(profileId: string, input: Create) {
    await assertWithinCapacity(
      this.capacity,
      profileId,
      async () => (await this.repo.list(profileId)).length,
    );
    return this.repo.create(profileId, input);
  }

  async update(profileId: string, id: string, patch: Patch) {
    const item = await this.repo.update(profileId, id, patch);
    if (!item) throw new NotFoundError(`${this.label} introuvable`);
    return item;
  }

  async remove(profileId: string, id: string) {
    if (!(await this.repo.remove(profileId, id))) throw new NotFoundError(`${this.label} introuvable`);
  }
}

/** In-memory repository for tests and for previews without a database. */
export class InMemoryCrudRepository<
  Dto extends { id: string },
  Create,
  Patch = Partial<Create>,
> implements CrudRepository<Dto, Create, Patch> {
  private rows = new Map<string, Dto[]>();

  constructor(
    private readonly seedProfileId: string | undefined,
    private readonly seed: () => Omit<Dto, "id">[],
    private readonly build: (input: Create) => Omit<Dto, "id">,
  ) {}

  private forProfile(profileId: string) {
    let list = this.rows.get(profileId);
    if (!list) {
      list =
        profileId === this.seedProfileId ? this.seed().map((r) => ({ ...r, id: randomUUID() }) as Dto) : [];
      this.rows.set(profileId, list);
    }
    return list;
  }

  async list(profileId: string) {
    return [...this.forProfile(profileId)];
  }

  async findById(profileId: string, id: string) {
    return this.forProfile(profileId).find((r) => r.id === id) ?? null;
  }

  async create(profileId: string, input: Create) {
    const row = { ...this.build(input), id: randomUUID() } as Dto;
    this.forProfile(profileId).push(row);
    return row;
  }

  async update(profileId: string, id: string, patch: Patch) {
    const row = this.forProfile(profileId).find((r) => r.id === id);
    if (!row) return null;
    // Full replace: clearing an optional field in the form must clear it in the row.
    Object.assign(row, this.build(patch as unknown as Create));
    return row;
  }

  async remove(profileId: string, id: string) {
    const list = this.forProfile(profileId);
    const index = list.findIndex((r) => r.id === id);
    if (index === -1) return false;
    list.splice(index, 1);
    return true;
  }
}
