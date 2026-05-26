# V1.3 Certification Application Submission Migration Notes

## Current submission flow

The Taoist priest certification application page is `app/certification/taoist-priest/page.tsx`.

The page builds a single `FormData` payload and posts it to:

```text
POST /api/certification-applications
```

The payload includes all text fields, declaration fields, honeypot field, and uploaded files in the same request. The current Next.js route at `app/api/certification-applications/route.ts` is the owner of validation, duplicate open-application checks, application number generation, Supabase Storage upload, and database insert.

The success page receives the generated application number from the API response:

```text
/application/success?type=certification&number=<application_no>
```

## Current field boundary

The current insert into `certification_applications` is built from `CertificationApplicationRecord` and mapped by `toCertificationRow` in `lib/supabase/server.ts`.

The submission writes these field groups:

- Identity: `application_no`, `certification_type`, `applicant_name`, `applicant_name_en`, `taoist_name`, `gender`, `birth_date`, `nationality`, `residence`, `phone`, `email`, `address`
- Certification request: `certification_path`, `requested_level`
- Lineage and practice: `master_name`, `master_taoist_name`, `lineage`, `temple_or_organization`, `sect`, `practice_years`, `experience_summary`, `application_reason`, `additional_note`
- Recommender: `recommender_name`, `recommender_contact`, `recommender_relation`
- Attachments: `existing_certificates`, `supporting_documents`, `certificate_photo_path`
- Declarations: `declaration_accepted`, `ethics_confirmed`, `boundary_confirmed`, `data_use_accepted`, `certificate_public_accepted`, `terms_accepted`, `privacy_accepted`, `confirmed_at`
- Review state defaults: `status`, `review_note`, `internal_review_note`, `applicant_feedback`, `approved_path`, `approved_level`, `material_review`, `committee_review_note`, `reviewer`, `reviewed_at`, `delivery_status`, `delivered_at`, `supplemental_submissions`, `supplement_submitted_at`
- Timestamps: `created_at`, `updated_at`

The current application number rule is `ITCA-TAO-<year>-<six random digits>`, implemented by `generateCertificationApplicationNo`.

The initial status is `submitted`.

The current material review default is `defaultMaterialReview`; this is required by the admin review page and certificate generation gating.

## File upload and Storage dependency

The current route validates and uploads files in the same request as the form submission.

Allowed upload fields are:

- Existing certificates: `luDocument`, `jieDocument`, `duDocument`, `guanJinDocument`, `lineageProof`, `templeProof`, `internalVoucher`
- Supporting documents: `idProof`, `photo`, `criminalRecord`, `educationProof`, `practiceReport`, `organizationLetter`, `crossCulturePlan`

Allowed file types are PDF, JPG, JPEG, and PNG. The current size limit is 2 MB per file.

Files are uploaded to the private Supabase Storage bucket:

```text
certification-documents
```

The current Storage path format is:

```text
certification-applications/<application_no>/<category>/<field_name>/<timestamp>-<sanitized_original_name>
```

The returned attachment metadata is written into `existing_certificates` or `supporting_documents`. The `photo` supporting document also populates `certificate_photo_path`.

Admin detail pages create signed URLs from these Storage paths. Public application progress may report whether a photo is recorded, but must not expose Storage paths.

## Migration decision for round 14

Do not switch the live certification application submission to .NET in this round.

Reason: submission and file upload are strongly coupled today:

- The browser sends one `multipart/form-data` request containing text fields and files.
- The Next.js route uploads files to Supabase Storage before inserting the row.
- The inserted row depends on uploaded file metadata and `certificate_photo_path`.
- The admin certification review flow depends on `existing_certificates`, `supporting_documents`, signed URL generation, `certificate_photo_path`, and `material_review`.
- Migrating only text fields would either drop attachment metadata or require inventing placeholder Storage paths, both of which would break the V1.2 certification application closure.

Therefore round 14 should keep `POST /api/certification-applications` as the live submission endpoint.

## Future .NET API boundary

Before .NET can safely own certification application submission, split the workflow into explicit interfaces.

Recommended future endpoints:

```text
POST /api/certification-applications
```

Creates the application row after upload metadata is available, or accepts a finalized payload that already includes validated attachment metadata.

```text
POST /api/certification-applications/uploads/presign
```

Returns a constrained upload authorization for a specific application draft, field name, file type, and size.

```text
POST /api/certification-applications/{applicationNo}/attachments
```

Records uploaded attachment metadata after Storage upload completion.

```text
POST /api/certification-applications/{applicationNo}/submit
```

Finalizes a draft application once required fields, declarations, and required attachment rules pass validation.

The final design can also keep Storage upload in Next.js and route only the database insert through .NET, but only if the attachment metadata contract is explicit and the application number is generated before upload.

## Compatibility requirements

Any future migration must preserve:

- `application_no` format: `ITCA-TAO-<year>-<six digits>`
- Initial status: `submitted`
- Current declaration and consent fields
- Recommender fields
- Lineage, temple, sect, practice history, application reason, and additional note fields
- Attachment metadata shape in `existing_certificates` and `supporting_documents`
- `certificate_photo_path` behavior for the `photo` field
- `material_review` defaults
- Duplicate open-application detection by email or phone
- Success response shape: `{ success: true, applicationNo, status }`
- Existing application progress query behavior
- Existing admin list, detail, export, signed URL preview, material review, supplement, and certificate generation flows

## Information isolation

Never expose these fields on public pages or unauthenticated responses:

- Supabase Storage paths
- Signed URL internals beyond short-lived authorized views
- `internal_review_note`
- Material review internals unless an authenticated admin is viewing them
- Database IDs except where an authenticated admin route already requires them
- Full attachment metadata on public application query responses
- Service role keys, database connection strings, tokens, usernames, hosts, or bucket credentials

## Round 15 prerequisites

Before attempting the Storage-aware migration:

- Decide whether .NET or Next.js owns Supabase Storage upload.
- Define the attachment metadata DTO and keep it compatible with `CertificationAttachment`.
- Define how `application_no` is generated before upload paths are created.
- Define required and optional attachment rules per certification path and requested level.
- Define rollback behavior when upload succeeds but database insert fails.
- Define cleanup behavior for orphaned Storage objects.
- Define 400, 409, 500, and 503 handling without falling back on validation or duplicate-submission errors.
- Add end-to-end tests covering submit, progress query, admin list, admin detail, signed URL preview, supplement, and certificate generation.

## Rollback and fallback strategy

During any future live migration:

- Keep the existing Next.js submission route available as fallback for network failure, 500, or 503 only.
- Do not fallback on 400 validation failures.
- Do not fallback on 409 duplicate application responses.
- Preserve the current success page redirect contract.
- Keep a feature flag or narrow call wrapper so the page can return to the Next.js route without changing form behavior.
