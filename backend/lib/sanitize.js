// Strip credential fields before a resident record ever leaves the server.
export function publicResident(resident) {
  if (!resident) return resident;
  const { passwordHash, ...safe } = resident;
  return safe;
}
