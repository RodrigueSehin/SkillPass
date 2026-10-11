import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { profileFor } from "@/lib/auth/profile";
import { talentHas, type TalentFeature } from "./entitlements";

/** Pages of a feature the talent's plan lacks do not exist for them: a plain 404. Returns the profile. */
export async function requireTalentFeature(feature: TalentFeature) {
  const profile = await profileFor(await requireUser());
  if (!talentHas(profile.plan, feature)) notFound();
  return profile;
}
