# V1.3 Storage Migration Plan

## Current Storage usage

Certification application files are stored in Supabase Storage and are currently owned by the Next.js server routes. The browser does not upload directly to Supabase.

The live certification application page submits one `multipart/form-data` request to:

```text
POST /api/certification-applications
```

That route validates the form, checks duplicate open applications, generates `application_no`, uploads files to Storage, then inserts the `certification_applications` row with attachment metadata.

The supplement form also submits `multipart/form-data` to:

```text
POST /api/applications/supplement
```

For certification applications, that route uploads new files, appends them to `supporting_documents`, updates `certificate_photo_path` when a new `photo` is provided, records the supplement submission, and moves the application back to `under_review`.

## Bucket

The current bucket is:

```text
certification-documents
```

`supabase/applications.sql` creates it as private:

```text
public = false
```

Server routes upload and sign files with the Supabase service role key. Do not move this key to the browser.

## Current upload entries

Primary certification application upload entry:

```text
app/api/certification-applications/route.ts
```

Supplement upload entry:

```text
app/api/applications/supplement/route.ts
```

Shared Storage helper:

```text
lib/supabase/server.ts
```

The shared helper is `uploadCertificationAttachment`.

## Upload method

Uploads are server-side only. `uploadCertificationAttachment` posts the file body to the Supabase Storage object API:

```text
/storage/v1/object/certification-documents/<storage_path>
```

The request uses the service role key in the server runtime and sets `x-upsert: false`.

## File fields

Primary certification application fields are split into two JSON columns.

`existing_certificates` fields:

- `luDocument`
- `jieDocument`
- `duDocument`
- `guanJinDocument`
- `lineageProof`
- `templeProof`
- `internalVoucher`

`supporting_documents` fields:

- `idProof`
- `photo`
- `criminalRecord`
- `educationProof`
- `practiceReport`
- `organizationLetter`
- `crossCulturePlan`

Supplement fields:

- `supplementFiles`
- `photo`
- `supplementPhoto` is normalized to `photo` if submitted

The supplement route allows up to 5 files per submission.

## File type and size limits

Allowed MIME types:

- `application/pdf`
- `image/jpeg`
- `image/png`

Allowed filename extensions:

- `.pdf`
- `.jpg`
- `.jpeg`
- `.png`

The current limit is 2 MB per file.

The primary certification page validates files in the browser and the API route validates again on the server. The supplement route validates on the server. The supplement page exposes browser `accept` filters for document and photo inputs.

## Storage path rule

The current path format is:

```text
certification-applications/<application_no>/<category>/<field_name>/<timestamp>-<sanitized_original_name>
```

Where:

- `application_no` is generated before upload.
- `category` is `existing_certificates` or `supporting_documents`.
- `field_name` is the form field or normalized supplement field.
- `timestamp` is derived from `uploadedAt` as `YYYYMMDDHHMMSS`.
- `sanitized_original_name` is normalized and limited by `sanitizeStorageName`.

This path currently embeds the application number, material category, field name, upload timestamp, and sanitized original filename.

## Attachment field structure

Attachment metadata is stored in JSON fields on `certification_applications`.

Current TypeScript shape:

```ts
type CertificationAttachment = {
  originalName: string;
  storagePath?: string;
  mimeType?: string;
  size?: number;
  fieldName: string;
  uploadedAt?: string;
  signedUrl?: string;
  source?: "application" | "supplement";
  supplementRound?: number;
};
```

Database columns:

- `existing_certificates jsonb`
- `supporting_documents jsonb`
- `certificate_photo_path text`
- `supplemental_submissions jsonb`

`signedUrl` is generated at read time for admin display and is not intended to be persisted.

## Admin preview

The admin certification detail page reads `existing_certificates`, `supporting_documents`, and `certificate_photo_path`, then creates short-lived signed URLs for each stored path.

Main preview page:

```text
app/admin/certification-applications/[id]/page.tsx
```

The page:

- Generates signed URLs with `createCertificationAttachmentSignedUrl`.
- Shows inline image previews when the attachment MIME type starts with `image/`.
- Provides admin-only open and download links using signed URLs.
- Falls back to a file-name-only warning when no Storage path exists.
- Builds supplement submission file previews by signing each `submission.files` entry.

## Signed URL usage

Current signed URL helper:

```text
createCertificationAttachmentSignedUrl(storagePath, expiresIn = 3600)
```

Current effective expiry:

```text
3600 seconds
```

Admin material previews use signed URLs. Applicant application progress can receive a signed photo URL only for certificate display after certificate data is available or through the photo fallback. Public certificate query results do not include raw Storage paths.

## Certificate photo dependency

The primary application route sets `certificate_photo_path` from the uploaded `photo` supporting document.

The supplement route updates `certificate_photo_path` when a new supplement `photo` is uploaded.

Certificate generation copies `application.certificatePhotoPath` into the generated certificate record. Applicant certificate display may sign that path for a short-lived photo preview. Admin detail also falls back to finding the `photo` item in `supporting_documents` when `certificate_photo_path` is missing.

Do not change this behavior without testing admin material preview, certificate generation, applicant progress query, and public certificate verification.

## Supplement upload dependency

`POST /api/applications/supplement` reuses `uploadCertificationAttachment`.

For certification applications it:

- Requires the application status to be `need_more_info`.
- Uploads files into `supporting_documents`.
- Appends uploaded file metadata to existing `supporting_documents`.
- Records uploaded files inside `supplemental_submissions`.
- Updates `certificate_photo_path` if the supplement contains `photo`.
- Moves the application back to `under_review`.

For membership applications it can also upload files into the same `certification-documents` bucket under an application-number path, even though the stored record is in the membership application supplement JSON.

## Information isolation

Current intended isolation rules:

- Storage bucket remains private.
- Service role key remains server-only.
- Browser never receives upload credentials.
- Admin material preview receives signed URLs only after admin session validation.
- Public application progress query must not expose raw Storage paths.
- Public certificate query must not expose raw Storage paths.
- Attachment metadata with `storagePath` should stay out of unauthenticated public responses.
- Signed URLs should stay short-lived and scoped to file viewing only.

Path privacy still matters because paths include application numbers, field names, and sanitized original filenames. Treat raw paths as sensitive metadata.

## Current risks

Garbage file risk:

Files are uploaded before the certification application row is inserted or updated. If the database write fails after one or more uploads succeed, the current code does not remove the uploaded Storage objects.

DB write failure residuals:

Primary submission and supplement submission both have possible residual object risk because there is no transactional boundary across Supabase Storage and PostgREST writes.

Path exposure risk:

Raw paths include application number, category, field name, timestamp, and sanitized filename. They must not be returned to public clients. Admin pages currently use them only server-side to create signed URLs.

Direct upload risk:

Browser direct upload would require a carefully constrained token or signed upload URL. Moving direct upload to the browser without a new authorization boundary could expose bucket paths, upload capability, or overwrite behavior.

Service role security risk:

The current upload and signing behavior requires server-only service role access. Any migration must keep service role credentials out of browser bundles, public logs, API responses, and env output.

Large file upload failure risk:

The current 2 MB limit keeps requests small. Raising this limit or moving upload across another API boundary may increase timeout, memory, and partial-failure risk.

Cross-flow coupling risk:

Certification submission, supplement upload, admin material preview, material review, certificate generation, applicant progress query, and certificate display all depend on compatible attachment metadata and photo path behavior.

## Migration decision

Do not perform a live Storage upload migration in this round.

Reason:

- The bucket is private.
- Upload requires service role authorization today.
- Next.js currently owns multipart parsing, validation, upload, and database writes in one route.
- Admin preview depends on current Storage paths and signed URL generation.
- Supplement submission reuses the same Storage helper and path family.
- Certificate generation depends on `certificate_photo_path`.
- There is no complete rollback or orphan cleanup mechanism.
- The .NET API does not yet own a verified Storage upload client, upload authorization model, or attachment metadata contract.

This round should be a boundary reservation and documentation round only.

## Future .NET API split

Recommended future boundaries:

```text
POST /api/files/upload-token
```

or:

```text
POST /api/storage/upload-url
```

Returns a constrained upload authorization for a specific authenticated or validated flow. It should bind application draft or application number, field name, category, MIME type, size, and expiry.

```text
POST /api/certification-applications
```

Creates or finalizes the certification application after validated attachment metadata is available.

```text
POST /api/applications/supplement
```

Accepts supplement text and already validated file metadata, or owns the upload transaction through the same server-side Storage client.

```text
GET /api/admin/files/{id}/signed-url
```

Returns a short-lived signed URL for an admin-authorized file record or attachment reference. Prefer file IDs or metadata IDs over raw Storage paths in public or client-controlled routes.

## Recommended migration route

Step 1: Keep the existing Next.js upload and submission routes unchanged. Document the Storage boundary and risks.

Step 2: Add a file record table or explicit file metadata structure. Include owner flow, owner application ID or draft ID, field name, category, original name, MIME type, size, Storage path, upload status, and timestamps.

Step 3: Let .NET own admin signed URL generation after it can authorize admin sessions and resolve file metadata without trusting raw client paths.

Step 4: Let .NET own upload authorization or server-side upload. Keep strict file type, size, category, and field validation.

Step 5: Let .NET own certification application submission only after attachment metadata, `application_no` generation, duplicate checks, rollback behavior, and supplement compatibility are implemented.

Step 6: Keep legacy path compatibility until all existing `existing_certificates`, `supporting_documents`, `certificate_photo_path`, certificate photo records, and supplement records have been verified or migrated.

## Rollback strategy

During migration:

- Keep the current Next.js routes available as fallback.
- Do not fallback on validation failures.
- Do not fallback on duplicate open-application responses.
- Fallback only for controlled 500 or 503 migration failures.
- Preserve the current success response contract.
- Preserve existing Storage paths and JSON metadata.
- Keep signed URL generation compatible with old and new records.
- Add cleanup for any uploaded file when the final database write fails.

## Safe next-round work

Next round can safely do:

- Add attachment metadata DTO definitions for the future .NET boundary.
- Add a design-only file metadata schema draft.
- Add tests that confirm public application query responses do not include `storagePath`.
- Add tests for admin signed URL preview behavior without changing the implementation.
- Add server-side helper tests for path generation if the helper is extracted without changing output.
- Add a cleanup design for orphaned Storage objects.

## Modules not to touch yet

Do not change these modules until the Storage contract and rollback plan are implemented:

- Supabase bucket configuration.
- Storage path format.
- `uploadCertificationAttachment` live behavior.
- `createCertificationAttachmentSignedUrl` live behavior.
- Primary certification application submission route.
- Supplement submission route.
- `existing_certificates` and `supporting_documents` JSON shape.
- `certificate_photo_path` behavior.
- Certificate generation photo path copy.
- Admin material preview and download behavior.
