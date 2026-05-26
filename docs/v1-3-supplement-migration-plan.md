# V1.3 Supplement Migration Plan

## Current complete flow

The supplement flow starts when an admin marks an application as `need_more_info` and provides applicant-facing feedback.

The applicant then opens the application progress query page, queries by application number and contact, sees the supplement form only while the status is `need_more_info`, submits corrected fields and optional files, and the server moves the application back to `under_review`.

For certification applications, the same request can update applicant data, append new supporting documents, update `certificate_photo_path`, write `supplemental_submissions`, update `supplement_submitted_at`, and add an internal review note.

## Current entry page

The applicant entry point is:

```text
app/application/query/page.tsx
```

The supplement UI is the `SupplementForm` component on that page. It is rendered only when:

```text
selectedApplication.status === "need_more_info"
```

The form builds a browser `FormData` object and adds:

```text
applicationNo
contact
```

before posting the request.

## Current API

The live supplement API is:

```text
POST /api/applications/supplement
```

Implementation:

```text
app/api/applications/supplement/route.ts
```

This API handles both certification applications and member applications. Certification applications are resolved first with `findCertificationSupplementTarget`; member applications are resolved second with `findApplicationSupplementTarget`.

## Current submission method

The submission method is `FormData` / `multipart/form-data`.

The route reads:

```ts
await request.formData()
```

This means text changes, honeypot, contact fields, supplement note, and files are submitted together.

## Current fields

Shared fields:

- `applicationNo`
- `contact`
- `supplementNote`
- `companyWebsite` honeypot

Certification editable text fields:

- `applicantNameEn`
- `gender`
- `birthDate`
- `nationality`
- `residence`
- `address`
- `phone`
- `email`
- `masterName`
- `masterTaoistName`
- `lineage`
- `templeOrOrganization`
- `sect`
- `practiceYears`
- `experienceSummary`
- `applicationReason`
- `additionalNote`
- `recommenderName`
- `recommenderContact`
- `recommenderRelation`

Member application editable text fields:

- `name`
- `contactName`
- `phone`
- `email`
- `country`
- `profile`
- `purpose`

## Current file fields

Supplement file inputs:

- `supplementFiles`
- `photo`
- `supplementPhoto`

`photo` and `supplementPhoto` are normalized to field name `photo`. Other file fields keep their key or fall back to `supplementFiles`.

Allowed file types:

- PDF
- JPG
- JPEG
- PNG

Server-side accepted MIME types:

- `application/pdf`
- `image/jpeg`
- `image/png`

Server-side accepted extensions:

- `.pdf`
- `.jpg`
- `.jpeg`
- `.png`

Limits:

- 2 MB per file
- 5 files per supplement submission

## Current Storage dependency

Supplement files use the same Storage helper as the primary certification application:

```text
uploadCertificationAttachment
```

The bucket is:

```text
certification-documents
```

The bucket is private and upload is server-side with the Supabase service role key. The browser does not upload directly to Supabase.

The current Storage path format remains:

```text
certification-applications/<application_no>/<category>/<field_name>/<timestamp>-<sanitized_original_name>
```

For supplement uploads, `category` is currently `supporting_documents`.

## supplemental_submissions structure

The current TypeScript shape is:

```ts
type SupplementalSubmission = {
  submittedAt: string;
  submittedBy: "applicant" | "admin";
  applicationNo: string;
  contact: string;
  note: string;
  changedFields: Array<{ field: string; oldValue?: string; newValue?: string }>;
  files: CertificationAttachment[];
  previousStatus: string;
  nextStatus: string;
};
```

Certification supplement submissions are appended to `certification_applications.supplemental_submissions`.

Member application supplement submissions are appended to `applications.supplemental_submissions`.

The current route writes `submittedBy: "applicant"`, stores the submitted contact, records a human-readable changed field list, stores uploaded file metadata, and records `previousStatus` as `need_more_info` with `nextStatus: "under_review"`.

## supporting_documents update logic

For certification applications:

1. Load the current certification application by application number and contact.
2. Require current status `need_more_info`.
3. Upload each submitted file with `category: "supporting_documents"`.
4. Mark uploaded files with `source: "supplement"` and `supplementRound`.
5. Build:

```text
nextSupportingDocuments = existing supportingDocuments + uploadedFiles
```

6. Patch `supporting_documents` with the combined array.

This preserves previous submitted files and appends new supplement files.

## certificate_photo_path update logic

For certification applications:

```text
latestPhotoPath = first uploaded file whose fieldName is "photo" and has storagePath,
                  otherwise existing certificatePhotoPath
```

The supplement update writes `certificate_photo_path` to `latestPhotoPath`.

This means a supplement photo can replace the certificate photo path used later by certificate generation.

## status and supplement_submitted_at logic

The supplement update helpers set:

```text
status = "under_review"
supplement_submitted_at = now
updated_at = now
```

For certification applications this is done in `updateCertificationSupplement`.

For member applications this is done in `updateApplicationSupplement`.

The public UI then treats an `under_review` application with a supplement record or `supplement_submitted_at` as:

```text
已补充，待复核
```

## Admin material review dependency

Admin certification detail page:

```text
app/admin/certification-applications/[id]/page.tsx
```

The page shows:

- Existing attachments
- Supporting documents
- Supplement submission records
- Signed URL previews for supplement files
- Material review fields

Material review component:

```text
app/admin/certification-applications/[id]/MaterialReviewField.tsx
```

It sends:

```json
{
  "action": "update_material_review",
  "materialReview": { "...": "..." }
}
```

to:

```text
PATCH /api/admin/certification-applications/{id}
```

The admin API validates and normalizes `material_review`, then writes it through `updateCertificationReview`.

Certificate generation depends on this state: all `material_review` entries must be `passed` before generating a certificate.

## Application progress query display

Application progress query returns supplement-aware fields from Supabase helper conversion:

- `supplementSubmittedAt`
- `hasSupplementalSubmission`
- `editableData` only when status is `need_more_info`

The public query page:

- Shows the supplement form only in `need_more_info`.
- After successful supplement submission, locally updates the displayed application to `under_review`.
- Displays `已补充，待复核` when the application is `under_review` and has supplement evidence.
- Displays uploaded file names returned by the supplement API.

The public response does not need raw Storage paths for supplement display. Raw `storagePath` values should remain server-side or admin-only.

## Information isolation

Current intended rules:

- Raw Storage paths are not exposed on the application progress page.
- Public supplement success returns original file names only.
- Service role credentials remain server-only.
- Admin detail pages require an admin session before signing attachment URLs.
- Signed URLs are short-lived and should not be persisted in JSON fields.
- `internal_review_note` and detailed material review internals are not exposed to applicants.
- Applicant-facing feedback uses `applicant_feedback` or `review_note`, not internal notes.

## Current risks

Storage / DB no transaction:

File upload and database patch are separate operations. There is no single transaction covering Supabase Storage and the database update.

Garbage files:

If one or more supplement files upload successfully but `updateCertificationSupplement` or `updateApplicationSupplement` fails, uploaded files can remain in Storage without a durable database reference.

Repeated supplement:

The route rejects online supplement unless current status is `need_more_info`, but concurrent submissions can still race around the same status and append order.

Status race:

Admin review status changes and applicant supplement submission can race. The route checks status before upload and patch, but there is no compare-and-swap update on the final PATCH.

Material review mismatch:

Supplement files can change the material set after prior material review decisions. The current flow does not automatically reset affected `material_review` items when new files are appended.

Certificate photo override:

A supplement `photo` updates `certificate_photo_path`. This is intentional today, but it means a later supplement photo can change the image copied into a future certificate record.

Path leakage:

Storage paths include application number, category, field name, timestamp, and sanitized original filename. They must not be returned to public clients.

Service role boundary:

Upload and signed URL generation depend on server-only service role access. Any migration must keep this boundary out of browser code and logs.

## Migration decision

Do not migrate the live supplement submission endpoint in this round.

Reasons:

- The current request is multipart.
- The route uploads files and writes database fields in one flow.
- Upload uses a private bucket with service role authorization.
- Certification supplement updates `supporting_documents`.
- Supplement photo can update `certificate_photo_path`.
- The route writes `supplemental_submissions`.
- The route changes `status` and `supplement_submitted_at`.
- Admin material review and certificate generation depend on the resulting fields.
- Existing Storage cleanup and concurrency controls are not strong enough to split the flow safely yet.

This round should keep the live Next.js supplement route unchanged and reserve the migration boundary in documentation.

## Future .NET API split

Recommended future endpoints:

```text
POST /api/applications/{applicationNo}/supplements
```

Owns supplement submission after upload metadata is available, or owns the full upload-and-update transaction server-side.

```text
POST /api/admin/certification-applications/{id}/material-review
```

Owns only material review state changes. This is lower risk than supplement file upload because it is JSON-only and admin-authenticated.

```text
GET /api/admin/files/{id}/signed-url
```

Returns a short-lived signed URL after admin authorization and file metadata lookup. Prefer file IDs or metadata IDs over client-supplied raw Storage paths.

```text
POST /api/storage/upload-url
```

or:

```text
POST /api/files/upload-token
```

Returns constrained upload authorization for a specific application, supplement round, category, field name, MIME type, size, and expiry.

## Recommended migration route

Step 1: Keep the existing Next.js supplement submission route unchanged.

Step 2: Let .NET own material review writes first. This is JSON-only and does not require Storage upload, path generation, or `certificate_photo_path` changes.

Step 3: Let .NET own admin signed URL generation after it can authorize admin sessions and resolve files without trusting raw public paths.

Step 4: Add a safe upload authorization or server-side upload boundary for supplement files, including cleanup behavior for abandoned files.

Step 5: Let .NET own live supplement submission only after it can preserve `supporting_documents`, `certificate_photo_path`, `supplemental_submissions`, status transitions, and rollback behavior.

## Modules not to touch yet

Do not change these modules during supplement migration preparation:

- `app/api/applications/supplement/route.ts` live behavior
- Storage bucket configuration
- Storage path format
- `uploadCertificationAttachment`
- `createCertificationAttachmentSignedUrl`
- `certificate_photo_path` update behavior
- `supporting_documents` JSON shape
- `supplemental_submissions` JSON shape
- `material_review` JSON shape
- Certificate generation
- Admin certification detail layout and attachment preview
- Primary certification application submission
- Member application submission
- Public certificate query
- Supabase SQL

## Rollback strategy

During any future migration:

- Keep the current Next.js supplement route available as fallback.
- Do not fallback on validation failures, missing contact, missing application, unsupported status, or duplicate/conflict responses.
- Fallback only on controlled migration 500 or 503 failures.
- Preserve the current response shape:

```json
{ "success": true, "message": "补充资料已提交", "files": ["..."] }
```

- Preserve public status wording and admin supplement records.
- Preserve old and new attachment metadata compatibility.
- Add cleanup for uploaded files when the final database update fails.
- Consider conditional updates that require current status `need_more_info` at patch time.

## Next-round recommendations

Safe next work:

- Add tests that public application query responses do not include raw `storagePath`.
- Add tests for `formatQueryStatus` and `formatCertificationApplicationStatus` around supplement records.
- Draft a .NET material-review endpoint contract before implementation.
- Draft a file metadata table or DTO for supplement uploads.
- Design orphan cleanup for uploaded-but-unreferenced Storage files.

Do not migrate live supplement upload until Storage authorization, cleanup, and status race handling are implemented.
