// Every admin operation must be listed here. New or unknown actions are denied.
const permissions = {
  GET: {
    me: 'admin', stats: 'admin', members: 'admin', allowlist: 'admin',
    events: 'admin', proposed: 'admin', offerings: 'admin', forum: 'admin',
    'forum-memberships': 'admin',
    'export-allowlist': 'super_admin', admins: 'super_admin',
  },
  POST: {
    'add-allowlist': 'admin', 'bulk-add-allowlist': 'admin',
    'update-allowlist': 'admin', 'remove-allowlist': 'admin',
    'add-event': 'admin', 'update-event': 'admin', 'delete-event': 'admin',
    'approve-proposed': 'admin', 'reject-proposed': 'admin',
    'delete-offering': 'admin', 'delete-post': 'admin', 'delete-reply': 'admin',
    'export-member': 'super_admin', 'delete-member': 'super_admin',
    'gdpr-erase-member': 'super_admin', 'add-admin': 'super_admin',
    'update-admin': 'super_admin', 'remove-admin': 'super_admin',
  },
};

export function requiredAdminRole(method, action) {
  const actions = Object.hasOwn(permissions, method) && permissions[method];
  return actions && typeof action === 'string' && Object.hasOwn(actions, action)
    ? actions[action] : null;
}
