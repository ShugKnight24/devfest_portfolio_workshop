// System design · lesson 10, case study. Track lang is null: predicts carry an `output` answer.
export default {
  id: 'file-uploads',
  builds: ['design/requests-and-servers'],
  title: 'Case study: file upload and sharing',
  goal: 'Let users upload, share and download large files without the bytes passing through your servers, using pre-signed URLs and a private bucket.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'Step 1: clarify',
      md: `
**The question:** "Design file upload and sharing", like attaching reports in an internal tool.

**Questions to ask, with typical answers:**

- "How big are files?" From a few KB up to several GB.
- "Who can see a file?" The owner, plus people they share it with.
- "Virus scanning?" Yes; nothing is downloadable until it's scanned.
- "Is it sensitive?" Assume yes: private by default, encrypted, every access logged.

The conclusion: **big files, strict access control, and nothing served before it's checked.**

Files are not rows. Lesson 6's table said where they go: **object storage**, like Amazon S3. S3 stores objects by key (\`uploads/42/report.pdf\`), keeps them durable, and scales without you managing disks. The interesting question is how bytes get **into** and **out of** it.
`,
    },
    {
      type: 'read',
      title: 'The obvious version',
      md: `
The first idea is to send the file to your API, and have the API pass it on:

~~~
[ Browser ] --2 GB--> [ API server ] --2 GB--> [ S3 ]
~~~

It works for a profile picture. For big files it means:

- every byte crosses your servers **twice** (in from the user, out to S3);
- each upload ties up a server's connection and network for as long as the upload takes;
- request timeouts and body-size limits at the load balancer start rejecting large files.
`,
    },
    {
      type: 'predict',
      title: 'Fifty big uploads',
      code: `Two API servers. Uploads go through them to S3.
At 9:00, fifty people each start uploading a 2 GB video.`,
      output: `The API servers spend their network and connections relaying
100 GB of video. Normal requests slow down or time out, and
long uploads hit request timeouts and fail.`,
      explain: `
The API is meant to do quick work: check permissions, read and write rows. Relaying huge files is slow, heavy work that S3 is built for.

So the better design keeps the bytes **off** your servers entirely. The API only decides **who may upload what**, and the browser talks to S3 directly.
`,
    },
    {
      type: 'read',
      title: 'Pre-signed URLs',
      md: `
A **pre-signed URL** is a link to one S3 object, signed with your server's credentials, that allows **one action** (upload or download) on **that one key** until it **expires**. Whoever holds it can use it; nobody can change it without breaking the signature.

~~~
1. Browser --> API: "I want to upload report.pdf, 4 MB"
2. API checks the user may upload, creates a files row
   (status: pending), and signs a PUT URL valid for 5 min
3. API --> Browser: { fileId, uploadUrl }
4. Browser --PUT bytes--> S3, directly
5. S3 event --> Worker: scan the file, then mark it ready
~~~

- Your servers handle a couple of small JSON requests. S3 handles the gigabytes.
- The bucket stays **private**. The only way in is a URL your API chose to sign.
- For very large files, S3's **multipart upload** splits the file into parts, each with its own pre-signed URL, so a dropped connection only re-sends one part.
`,
    },
    {
      type: 'read',
      title: 'Step 3: data and API',
      md: `
**Tables:**

~~~
files(id, owner_id, s3_key, name, size, content_type,
      status, created_at)
shares(file_id, user_id, permission)
~~~

\`status\` goes \`pending\`, then \`scanning\`, then \`ready\` (or \`rejected\`). Use your own generated \`s3_key\` (like \`files/<id>\`), never the user's file name, so names can't collide or be used to write somewhere unexpected.

**API:**

| Endpoint | Does |
|---|---|
| \`POST /files { name, size, type }\` | checks limits, creates the row, returns a pre-signed upload URL |
| \`GET /files/:id/download\` | checks permission and status, returns a short-lived download URL |
| \`POST /files/:id/shares { userId }\` | owner shares the file |

Note what the API **doesn't** have: an endpoint that receives file bytes.
`,
    },
    {
      type: 'predict',
      title: 'Ready too soon',
      md: 'A shortcut version marks the file as ready as soon as it hands out the upload URL.',
      code: `POST /files  -> creates the row with status "ready"
              -> returns the upload URL

Case A: the user closes the tab before uploading.
Case B: the user uploads a file containing malware.`,
      output: `A: the file appears in lists, but downloading it fails because
nothing was ever uploaded.
B: the malware is downloadable straight away, before any scan.`,
      explain: `
The API can't know an upload happened, or what was in it, at the moment it signs the URL. So it records \`pending\`, and only the **worker triggered by S3's "object created" event** moves the file forward: it checks the object exists, scans it, and only then sets \`ready\`.

A cleanup job deletes rows that stay \`pending\` for too long, along with any partial uploads.
`,
    },
    {
      type: 'read',
      title: 'Downloads and sharing',
      md: `
Downloads use the same idea in reverse:

1. The browser asks \`GET /files/7/download\`.
2. The API checks the user is the owner or has a share, and that the status is \`ready\`.
3. It writes an audit entry: who downloaded what, and when.
4. It returns a pre-signed **GET** URL valid for a few minutes. The browser downloads straight from S3.

**Never make the bucket public** to make downloads easier. A public bucket can't check who's asking, so anyone who learns or guesses a key can read the file.

If many people download the same **public** files (product images, say), put a CDN in front (lesson 2). Private files stay behind short-lived signed URLs.
`,
    },
    {
      type: 'predict',
      title: 'The week-long link',
      code: `Download URLs are signed to last 7 days.
Monday: Ada shares a file with Linus. He downloads it, and
the download URL ends up pasted in a team chat.
Tuesday: Ada removes Linus's access.`,
      output: `Anyone who has that URL can still download the file until
Sunday. Removing the share in your database doesn't cancel
a pre-signed URL that was already handed out.`,
      explain: `
A pre-signed URL is checked by S3, not by your API, so S3 only checks the signature and the expiry. Your sharing rules were applied **once**, when the URL was signed.

So keep download URLs **short** (minutes, not days), and get a fresh one from the API each time. Then a removed share takes effect within minutes.
`,
    },
    {
      type: 'read',
      title: 'Step 5: security, trade-offs, and the 60-second version',
      md: `
**Security baseline:**

- Private bucket, all public access blocked.
- Encryption at rest (S3 with KMS keys) and HTTPS everywhere.
- Short-lived pre-signed URLs, for one key and one action each.
- Size and type limits checked when signing, and scanning before \`ready\`.
- Every upload, share and download written to an audit log.

**Trade-off:** pre-signed URLs keep servers small and fast, but once a URL is issued you can't take it back until it expires. Short expiry times are what keep that risk small.

**The 60-second version:** "The API never touches file bytes. It checks permissions, creates a pending file record, and hands out a short-lived pre-signed URL, so the browser uploads straight to a private, encrypted S3 bucket. S3's upload event triggers a worker that scans the file before marking it ready. Downloads work the same way: the API checks access, logs it, and returns a download URL valid for a few minutes. Large files use multipart upload."
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      items: [
        {
          q: 'What does a pre-signed upload URL let the browser do?',
          choices: ['Upload one object to one key in S3, until it expires', 'Read any file in the bucket', 'Call your API without a login token'],
          answer: 0,
          explain: 'It grants one action on one key for a limited time, signed by your server.',
          why: { 1: 'It\'s scoped to one key and one action.', 2: 'It\'s for S3 only; your API still requires its token.' },
        },
        {
          q: 'Why upload straight to S3 instead of through the API?',
          choices: ['Your servers don\'t spend bandwidth and connections relaying large files', 'S3 checks your app\'s permissions for you', 'It makes files smaller'],
          answer: 0,
          explain: 'The API makes the access decision; S3 does the heavy transfer.',
          why: { 1: 'S3 only checks the signature; the API made the permission decision before signing.', 2: 'The bytes are the same either way.' },
        },
        {
          q: 'When should a file be marked ready?',
          choices: ['After a worker sees it in S3 and the scan passes', 'When the upload URL is created', 'When the user clicks Upload'],
          answer: 0,
          explain: 'Only then do you know the file exists and is safe.',
          why: { 1: 'Nothing has been uploaded yet at that point.', 2: 'The upload might still fail, and it hasn\'t been scanned.' },
        },
        {
          q: 'Why keep download URLs valid for minutes rather than days?',
          choices: ['A URL keeps working until it expires, even after access is removed', 'S3 can\'t sign longer URLs', 'Short URLs download faster'],
          answer: 0,
          explain: 'Short expiry limits how long a leaked or outdated URL is useful.',
          why: { 1: 'S3 allows longer expiry; the choice is about risk.', 2: 'Expiry doesn\'t affect speed.' },
        },
      ],
    },
  ],
};
