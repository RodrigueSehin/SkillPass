/** Anyone who writes offers or evaluations, and the administrators, may maintain the skills referential. */
export const canManageSkills = (can: (permission: string) => boolean) =>
  can("org.manage") || can("jobs.create") || can("evaluations.create");
