import { describe, expect, it } from "vitest";
import type { JobOfferRepository } from "@/repositories/job-offer.repository";
import { InMemoryMatchingRepository } from "@/repositories/matching.memory";
import { InMemoryTalentDirectoryRepository } from "@/repositories/talent-directory.memory";
import type { OrgScope } from "./organization.service";
import { MatchingService } from "./matching.service";

const scope = (orgId: string): OrgScope =>
  ({ organization: { id: orgId }, member: { id: `member-${orgId}` } }) as unknown as OrgScope;

function setup() {
  const directory = new InMemoryTalentDirectoryRepository();
  const service = new MatchingService(new InMemoryMatchingRepository(), directory, {
    get: async () => null,
  } as unknown as JobOfferRepository);
  return { directory, service };
}

describe("MatchingService", () => {
  it("saves a public talent once and records the save in the history", async () => {
    const { directory, service } = setup();
    const [talent] = await directory.listPublic(1);
    const org = scope("org-1");
    const first = await service.save(org, talent!.username, { jobOfferId: null, match: 87.4 });
    const again = await service.save(org, talent!.username, { jobOfferId: null, match: 10 });
    expect(again.id).toBe(first.id);
    expect(first.match).toBe(87);
    expect(first.status).toBe("TO_CONTACT");
    expect(await service.listSaved("org-1")).toHaveLength(1);
    const events = await service.listEvents("org-1", "2000-01-01T00:00:00.000Z");
    expect(events.filter((e) => e.type === "SAVE")).toHaveLength(2);
    expect(events[0]!.memberId).toBe("member-org-1");
  });

  it("refuses a talent that is not public", async () => {
    const { service } = setup();
    await expect(
      service.save(scope("org-1"), "nobody-here", { jobOfferId: null, match: null }),
    ).rejects.toThrow(/introuvable/i);
  });

  it("keeps organizations apart", async () => {
    const { directory, service } = setup();
    const [talent] = await directory.listPublic(1);
    await service.save(scope("org-1"), talent!.username, { jobOfferId: null, match: null });
    expect(await service.listSaved("org-2")).toEqual([]);
    expect(await service.listEvents("org-2", "2000-01-01T00:00:00.000Z")).toEqual([]);
    const [saved] = await service.listSaved("org-1");
    await expect(service.setStatus("org-2", saved!.id, "POOL")).rejects.toThrow();
    expect(await service.removeSaved("org-2", [saved!.id])).toBe(0);
  });

  it("changes the status, rejects unknown ones and removes saves", async () => {
    const { directory, service } = setup();
    const [talent] = await directory.listPublic(1);
    const saved = await service.save(scope("org-1"), talent!.username, { jobOfferId: null, match: null });
    expect((await service.setStatus("org-1", saved.id, "POOL")).status).toBe("POOL");
    await expect(service.setStatus("org-1", saved.id, "HIRED")).rejects.toThrow();
    expect(await service.removeSavedByUsername("org-1", talent!.username)).toBe(true);
    expect(await service.listSaved("org-1")).toEqual([]);
  });

  it("clips what is written in the history", async () => {
    const { service } = setup();
    const event = await service.record(scope("org-1"), {
      type: "SEARCH",
      title: "x".repeat(500),
      subtitle: "",
      results: 3,
      query: "q".repeat(2000),
      profileId: null,
    });
    expect(event.title).toHaveLength(160);
    expect(event.query).toHaveLength(600);
  });
});
