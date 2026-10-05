import { cache } from "react";
import { getProfileAccountService } from "@/services/container";
import type { CurrentUser } from "./current-user";

/** Profile of the signed-in user, loaded once per request even when layout and page both ask. */
export const loadProfile = cache(async (id: string, email: string, name: string) =>
  getProfileAccountService().get({ id, email, name }),
);

export const profileFor = (user: CurrentUser) => loadProfile(user.id, user.email, user.name);
