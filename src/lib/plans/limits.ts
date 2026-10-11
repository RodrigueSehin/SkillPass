import { ForbiddenError } from "@/lib/errors";

/** What a talent's plan allows for one kind of item, resolved when the item is added. */
export type Capacity = (
  profileId: string,
) => Promise<{ max: number | null; planName: string; noun: [one: string, many: string] }>;

/** Refuses the new item when the plan's limit is already reached. Unlimited plans (max null) always pass. */
export async function assertWithinCapacity(
  capacity: Capacity | undefined,
  profileId: string,
  current: () => Promise<number>,
) {
  if (!capacity) return;
  const { max, planName, noun } = await capacity(profileId);
  if (max === null) return;
  if ((await current()) >= max) {
    throw new ForbiddenError(
      `Votre plan ${planName} est limité à ${max} ${max > 1 ? noun[1] : noun[0]}. Passez au plan Pro pour en ajouter davantage.`,
    );
  }
}
