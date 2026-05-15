const nextConfig = {
  images: {
    domains: [
      'nestbridge-photos.s3.us-east-1.amazonaws.com',
      'images.unsplash.com',
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig