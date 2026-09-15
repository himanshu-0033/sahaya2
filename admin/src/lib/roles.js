// How each admin panel role is named wherever it is shown.
export const ROLE_LABEL = {
  super_admin: 'Super admin',
  counsellor: 'Counsellor',
  manager: 'Manager',
};

export const roleLabel = (admin) => ROLE_LABEL[admin?.role] || (admin?.superAdmin ? 'Super admin' : 'Admin');
