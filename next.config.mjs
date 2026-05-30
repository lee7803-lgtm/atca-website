/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      "/api/admin/certification-applications/[id]/certificate-pdf": ["./public/fonts/NotoSansCJKsc-Regular.otf"]
    }
  }
};

export default nextConfig;
