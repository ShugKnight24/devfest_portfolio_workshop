// System design · lesson 12, case study. lang: 'js' so it can include the RBAC and audit-log tasks.
export default {
  id: 'secure-dashboard',
  lang: 'js',
  builds: ['js/objects', 'js/spread-and-destructuring', 'js/filter-and-find', 'node/middleware'],
  title: 'Case study: a secure internal dashboard',
  goal: 'Design an internal records app where the hard parts are sign-in, role-based access and audit logs, and write the access checks yourself.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'Step 1: clarify',
      md: `
**The question:** "Design an internal dashboard where staff view and edit records", for example case files at a government agency.

**Questions to ask, with typical answers:**

- "Who uses it, and what roles?" A few hundred staff: viewers, editors, admins.
- "How sensitive is the data?" Sensitive. For US government work this can be Controlled Unclassified Information (CUI).
- "Where must it run?" Possibly a government cloud region, such as AWS GovCloud.
- "Audit requirements?" Yes: who saw or changed what, and when.

Then say the conclusion out loud, because it's what the interviewer is checking for: **"At a few hundred users, scale isn't the hard part. Access control, auditability and compliance are, so that's where I'll spend the design time."**

Every earlier case study grew because of traffic. This one is about **trust**.
`,
    },
    {
      type: 'read',
      title: 'Step 2: the boxes',
      md: `
~~~
[ Browser: React ]
    |  1. sign in through the agency's identity provider
    v     (OIDC or SAML, often with a smart card)
[ API ]  2. verify the token on every request
    |    3. check the user's role for this action
    +--> [ Postgres: records ]   encrypted at rest
    +--> [ Audit log ]           append-only
    +--> [ S3: exports ]         private, encrypted
All inside a private network in the cloud account
~~~

Nothing here is new: client, API, database, object storage. What's new is the **checks** on every arrow. The next steps go through them one by one.
`,
    },
    {
      type: 'read',
      title: 'Authentication: who are you?',
      md: `
**Authentication** answers "who is this?". Don't build your own password system. Agencies already run an **identity provider** (IdP), and staff sign in with it, often using a smart card (CAC or PIV).

The flow, in short:

1. The app redirects the user to the IdP's sign-in page.
2. After sign-in, the IdP sends them back with a one-time code, which the app exchanges for **tokens**, using **OIDC** (OpenID Connect) or **SAML**.
3. Every API request carries the access token.
4. The API **verifies it on every request**: the signature (using the IdP's public keys), the expiry, and that it was issued for this app.

A token is a signed statement: "this is user 42, valid until 10:30". Anyone can read it, but nobody can change it without breaking the signature. Keep access tokens short-lived, and in the browser prefer \`httpOnly\` cookies, which JavaScript can't read, over \`localStorage\`.

**Authorization** is the separate question: "is this user **allowed** to do this?" That's next, and it's where you'll write code.
`,
    },
    {
      type: 'read',
      title: 'Authorization: role-based access control',
      md: `
**RBAC** gives each user a **role**, and each role a list of **permissions**. Code checks permissions, never role names directly, so adding a role later doesn't mean hunting through every route.

~~~js
const ROLE_PERMISSIONS = {
  viewer: ["read"],
  editor: ["read", "edit"],
  admin:  ["read", "edit", "delete", "export"],
};

const ada = { id: 1, role: "editor" };
console.log(ROLE_PERMISSIONS[ada.role]);
console.log(ROLE_PERMISSIONS[ada.role].includes("delete"));
~~~

One rule matters more than any other: **deny by default**. If the role is unknown, missing, or misspelled, the answer is no.
`,
    },
    {
      type: 'task',
      title: 'can(user, action)',
      md: `
Write \`can(user, action)\`. It returns \`true\` only if the user's role has that permission in \`ROLE_PERMISSIONS\`.

An unknown role must return \`false\` (deny by default), not throw an error.

~~~
can({ role: "editor" }, "edit")    → true
can({ role: "viewer" }, "edit")    → false
can({ role: "intern" }, "read")    → false   (unknown role)
~~~
`,
      starter: `const ROLE_PERMISSIONS = {
  viewer: ["read"],
  editor: ["read", "edit"],
  admin: ["read", "edit", "delete", "export"],
};

function can(user, action) {
  return ROLE_PERMISSIONS[user.role].includes(action);
}
`,
      tests: [
        { name: 'an editor can edit', code: `eq(can({ role: "editor" }, "edit"), true);` },
        { name: 'a viewer cannot edit', code: `eq(can({ role: "viewer" }, "edit"), false);` },
        { name: 'only an admin can export', code: `eq(can({ role: "admin" }, "export"), true); eq(can({ role: "editor" }, "export"), false);` },
        { name: 'an unknown role is denied, not an error', code: `eq(can({ role: "intern" }, "read"), false);` },
      ],
      hint: 'Look the list up first, with a fallback: `const allowed = ROLE_PERMISSIONS[user.role] || [];` then `return allowed.includes(action);`',
      solution: `const ROLE_PERMISSIONS = {
  viewer: ["read"],
  editor: ["read", "edit"],
  admin: ["read", "edit", "delete", "export"],
};

function can(user, action) {
  const allowed = ROLE_PERMISSIONS[user.role] || []; // unknown role: no permissions
  return allowed.includes(action);
}
`,
      explain: 'The starter crashed on an unknown role. In a real API that crash might be caught somewhere and turned into "allowed", so make "no" the natural result instead.',
    },
    {
      type: 'predict',
      title: 'The hidden button',
      md: 'The React app hides the Delete button from viewers. The API route has no check of its own. A viewer opens the browser\'s dev tools and sends the request directly.',
      code: `function deleteRecordRoute(req) {
  // no permission check: "the UI hides the button anyway"
  return "deleted record " + req.params.id;
}

const req = { user: { id: 9, role: "viewer" }, params: { id: 7 } };
console.log(deleteRecordRoute(req));`,
      output: `deleted record 7`,
      explain: `
Hiding a button is a convenience for honest users, not security. Anyone can send any request to your API with dev tools, \`curl\`, or a script.

**Every check must happen on the server**, on every route. The UI can hide what a user can't do, but the API is what actually enforces it.
`,
    },
    {
      type: 'task',
      title: 'requirePermission middleware',
      md: `
Rather than repeat the check in every route, wrap routes in a **middleware**: a function that takes a handler and returns a new handler with the check in front.

\`can\` is included. Write \`requirePermission(action, handler)\`. It returns a function \`(req) => ...\` that:

1. returns \`{ status: 401 }\` if there is no \`req.user\` (not signed in);
2. returns \`{ status: 403 }\` if \`can(req.user, action)\` is false (signed in, not allowed);
3. otherwise returns \`handler(req)\`.

~~~
const del = requirePermission("delete", (req) => ({ status: 200 }));
del({ user: { role: "admin" } })    → { status: 200 }
del({ user: { role: "viewer" } })   → { status: 403 }
del({})                             → { status: 401 }
~~~
`,
      starter: `const ROLE_PERMISSIONS = {
  viewer: ["read"],
  editor: ["read", "edit"],
  admin: ["read", "edit", "delete", "export"],
};

function can(user, action) {
  const allowed = ROLE_PERMISSIONS[user.role] || [];
  return allowed.includes(action);
}

function requirePermission(action, handler) {
  return (req) => {
    // check first, then call the handler
    return handler(req);
  };
}
`,
      tests: [
        { name: 'an admin reaches the handler', code: `const del = requirePermission("delete", () => ({ status: 200 })); eq(del({ user: { role: "admin" } }), { status: 200 });` },
        { name: 'a viewer gets 403', code: `const del = requirePermission("delete", () => ({ status: 200 })); eq(del({ user: { role: "viewer" } }), { status: 403 });` },
        { name: 'no user gets 401', code: `const del = requirePermission("delete", () => ({ status: 200 })); eq(del({}), { status: 401 });` },
        { name: 'a refused request never runs the handler', code: `let ran = false; const del = requirePermission("delete", () => { ran = true; return { status: 200 }; }); del({ user: { role: "viewer" } }); eq(ran, false);` },
      ],
      hint: 'Inside the returned function: `if (!req.user) return { status: 401 };` then `if (!can(req.user, action)) return { status: 403 };` then `return handler(req);`',
      solution: `const ROLE_PERMISSIONS = {
  viewer: ["read"],
  editor: ["read", "edit"],
  admin: ["read", "edit", "delete", "export"],
};

function can(user, action) {
  const allowed = ROLE_PERMISSIONS[user.role] || [];
  return allowed.includes(action);
}

function requirePermission(action, handler) {
  return (req) => {
    if (!req.user) return { status: 401 };                  // not signed in
    if (!can(req.user, action)) return { status: 403 };     // signed in, not allowed
    return handler(req);
  };
}
`,
      explain: '401 means "I don\'t know who you are"; 403 means "I know who you are, and the answer is no". In Express this is the same shape as `app.delete("/records/:id", requirePermission("delete"), handler)`.',
    },
    {
      type: 'read',
      title: 'Audit logs',
      md: `
For sensitive systems you must be able to answer, months later, "who changed this record, and what was it before?" That's the **audit log**.

Every create, update, delete and export writes one entry:

~~~
{ who: 42, action: "update", recordId: 7,
  before: { status: "open" }, after: { status: "closed" },
  at: "2026-10-28T10:15:00Z" }
~~~

The rules that make it trustworthy:

- **Append-only.** Entries are added, never edited or deleted. The app's database user gets \`INSERT\` on the audit table but not \`UPDATE\` or \`DELETE\`. Many teams also copy entries to separate, write-once storage.
- **Written with the change.** Save the record and its audit entry in the same transaction (lesson 3), so there's never a change without an entry.
- **Snapshots, not references.** \`before\` must be a **copy** of the old values. The next scenario shows why.
`,
    },
    {
      type: 'predict',
      title: 'The audit entry that changed by itself',
      code: `const record = { id: 7, status: "open" };
const auditLog = [];

auditLog.push({ action: "update", before: record });  // no copy
record.status = "closed";                              // the update

console.log(auditLog[0].before.status);`,
      output: `closed`,
      explain: `
\`before: record\` stores a **reference** to the same object, not a copy. Changing \`record\` afterwards changes what the audit entry "remembers", so the log claims the record was already closed.

That's the object-reference behaviour from JavaScript lesson 7, and the spread copy from lesson 12. Take a copy with spread, \`before: { ...record }\`, **before** you change anything. In a real system the entry is written to the database as JSON, which makes its own copy, but the same bug appears whenever you build the entry from an object you then mutate.
`,
    },
    {
      type: 'task',
      title: 'Update a record, with an audit entry',
      md: `
Write \`updateRecord(records, auditLog, user, id, changes, now)\`:

- \`records\` is a \`Map\` from id to record object.
- Build \`after\` as a **new** object: the old record with \`changes\` spread over it.
- Store \`after\` in \`records\` under the same id.
- Push one entry onto \`auditLog\`: \`{ who: user.id, action: "update", recordId: id, before, after, at: now }\`, where \`before\` is a **copy** of the old record.
- Return \`after\`.

~~~
records: 7 → { id: 7, status: "open" }
updateRecord(records, log, { id: 42 }, 7, { status: "closed" }, 1000)
  → { id: 7, status: "closed" }
log[0].before → { id: 7, status: "open" }
~~~
`,
      starter: `function updateRecord(records, auditLog, user, id, changes, now) {
  const old = records.get(id);
  // build after, save it, write the audit entry, return after
}
`,
      tests: [
        {
          name: 'returns and stores the updated record',
          code: `const records = new Map([[7, { id: 7, status: "open" }]]);
const after = updateRecord(records, [], { id: 42 }, 7, { status: "closed" }, 1000);
eq(after, { id: 7, status: "closed" });
eq(records.get(7), { id: 7, status: "closed" });`,
        },
        {
          name: 'writes one audit entry with who, what and when',
          code: `const records = new Map([[7, { id: 7, status: "open" }]]);
const log = [];
updateRecord(records, log, { id: 42 }, 7, { status: "closed" }, 1000);
eq(log.length, 1);
eq(log[0].who, 42); eq(log[0].action, "update"); eq(log[0].recordId, 7); eq(log[0].at, 1000);`,
        },
        {
          name: 'the entry keeps the old values in before',
          code: `const records = new Map([[7, { id: 7, status: "open" }]]);
const log = [];
updateRecord(records, log, { id: 42 }, 7, { status: "closed" }, 1000);
eq(log[0].before, { id: 7, status: "open" });
eq(log[0].after, { id: 7, status: "closed" });`,
        },
        {
          name: 'the old record object is not mutated',
          code: `const original = { id: 7, status: "open" };
const records = new Map([[7, original]]);
updateRecord(records, [], { id: 42 }, 7, { status: "closed" }, 1000);
eq(original.status, "open", "build a new object with spread instead of changing the old one");`,
        },
      ],
      hint: '`const before = { ...old };` and `const after = { ...old, ...changes };`. Then `records.set(id, after);`, push the entry, and `return after;`',
      solution: `function updateRecord(records, auditLog, user, id, changes, now) {
  const old = records.get(id);
  const before = { ...old };             // a snapshot, not a reference
  const after = { ...old, ...changes };  // a new object; old is untouched
  records.set(id, after);
  auditLog.push({ who: user.id, action: "update", recordId: id, before, after, at: now });
  return after;
}
`,
      explain: 'In production, the record update and the audit insert run in one database transaction, and the route is wrapped in `requirePermission("edit", ...)`. That\'s the whole lesson in one route.',
    },
    {
      type: 'read',
      title: 'Step 5: security baseline and the 60-second version',
      md: `
**The baseline to list, briefly:**

- **TLS** everywhere, and **encryption at rest** for the database, backups and S3.
- **Least privilege:** each service's cloud (IAM) role can reach only what it needs.
- **No secrets in code:** use a secrets manager, and rotate keys.
- **Private network:** the database isn't reachable from the internet.
- **Dependency and container scanning** in CI.
- For US defense work, **NIST SP 800-171** is the usual set of controls for CUI, and **CMMC** is how contractors are assessed against it.

**Trade-off:** checks on every request and an audit write on every change add a little latency and storage. At a few hundred users that cost is tiny, and being able to prove who did what is the requirement.

**The 60-second version:** "A React front end and a Node API inside a private network in the government cloud. Users sign in through the agency's identity provider with OIDC or SAML, and the API verifies the token on every request, then checks the user's role through a permission middleware, denying by default. Records are in an encrypted Postgres, and every change writes an append-only audit entry with before and after, in the same transaction. At this size the challenge isn't scale; it's access control and auditability, so that's where I spent the design."
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      items: [
        {
          q: 'What is the difference between authentication and authorization?',
          choices: ['Authentication is who you are; authorization is what you may do', 'They are two names for the same check', 'Authentication happens in the browser; authorization on the server'],
          answer: 0,
          explain: 'You sign in once (authentication), and every action is checked against your role (authorization).',
          why: { 1: 'A signed-in user still can\'t do everything.', 2: 'Both must be enforced on the server.' },
        },
        {
          q: 'The UI hides the Delete button from viewers. Is that enough?',
          choices: ['No; the API must check the permission on every request', 'Yes, if the button is removed from the page entirely', 'Yes, if the site uses HTTPS'],
          answer: 0,
          explain: 'Anyone can call the API directly, so the server is the only real gate.',
          why: { 1: 'The request can be sent without the page at all.', 2: 'HTTPS protects the connection, not your rules.' },
        },
        {
          q: 'A user with a role the code has never heard of calls an endpoint. What should happen?',
          choices: ['Deny: unknown roles get no permissions', 'Allow read-only access', 'Allow, and log a warning'],
          answer: 0,
          explain: 'Deny by default means mistakes fail closed.',
          why: { 1: 'Even read access to sensitive records must be granted on purpose.', 2: 'Logging doesn\'t undo an access that shouldn\'t have happened.' },
        },
        {
          q: 'Signed in, but not allowed. Which status code?',
          choices: ['403 Forbidden', '401 Unauthorized', '404 Not Found'],
          answer: 0,
          explain: '403 means the server knows who you are and refuses. 401 means it doesn\'t know who you are.',
          why: { 1: '401 is for a missing or invalid login.', 2: 'Some APIs return 404 to hide that a record exists, but the standard answer is 403.' },
        },
        {
          q: 'Which makes an audit log trustworthy?',
          choices: ['Append-only, written in the same transaction as the change, with copies of before and after', 'Stored in the browser\'s localStorage', 'Editable by admins so mistakes can be fixed'],
          answer: 0,
          explain: 'Nobody can rewrite history, and no change can happen without its entry.',
          why: { 1: 'The user controls their own browser storage.', 2: 'An editable log can\'t prove anything.' },
        },
      ],
    },
  ],
};
