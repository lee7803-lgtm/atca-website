export const allowedUploadMimeTypes = ["application/pdf", "image/jpeg", "image/png"];
export const allowedUploadExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
export const maxUploadFileSize = 2 * 1024 * 1024;
export const uploadFileFormatMessage = "文件格式不支持，请上传 PDF、JPG、JPEG 或 PNG 文件。";
export const uploadFileSizeMessage = "文件大小超过限制，请上传不超过 2MB 的文件。";
export const uploadFileGeneralHint = "请上传 PDF、JPG、JPEG 或 PNG 文件，单个文件不超过 2MB。上传材料仅用于申请审核，请确保材料清晰、完整、可读。";
export const idProofUploadHint = "身份证明材料请上传 PDF、JPG、JPEG 或 PNG 文件，单个文件不超过 2MB；请确保信息清晰、未遮挡，并与申请人姓名一致。";
export const certificatePhotoUploadHint = "道装证件照请上传 JPG、JPEG 或 PNG 文件，单个文件不超过 2MB；照片需清晰、正面、无遮挡，可用于证书记录。";
export const lineageMaterialUploadHint = "师承 / 资质材料请上传 PDF、JPG、JPEG 或 PNG 文件，单个文件不超过 2MB；请确保文件清晰、来源可核验。";

export function isAllowedUploadFile(file: File) {
  const lowerName = file.name.toLowerCase();
  return allowedUploadMimeTypes.includes(file.type) || allowedUploadExtensions.some((extension) => lowerName.endsWith(extension));
}

export function getUploadFileError(file: File) {
  if (!isAllowedUploadFile(file)) return uploadFileFormatMessage;
  if (file.size > maxUploadFileSize) return uploadFileSizeMessage;
  return "";
}
