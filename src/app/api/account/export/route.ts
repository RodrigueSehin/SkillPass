import { withUser } from "@/lib/api/handler";
import { getPassportService, getProfileAccountService } from "@/services/container";

/** Everything SkillPass holds about the signed-in talent, as one JSON file (the right to portability). */
export const GET = withUser(async (user) => {
  const profile = await getProfileAccountService().get(user);
  const passport = await getPassportService().build(profile.id, {
    yearsOfExperience: profile.yearsOfExperience,
    updatedAt: profile.updatedAt,
  });
  const { id, ...rest } = profile;
  void id;
  const body = JSON.stringify(
    { exportedAt: new Date().toISOString(), account: { email: user.email }, profile: rest, passport },
    null,
    2,
  );
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="skillpass-${profile.username}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
});
