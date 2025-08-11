/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['kogmdiwyufeebdjayekd.supabase.co'],
  },
  // Note: For handling large file uploads (up to 500MB),
  // you may need to configure your hosting platform accordingly:
  // - Vercel: Configure in vercel.json with functions.maxDuration
  // - Self-hosted: Configure nginx/apache body size limits
  experimental: {
    // Increase server actions body size limit for large file uploads
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
}

module.exports = nextConfig