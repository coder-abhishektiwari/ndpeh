/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  async redirects() {
    return [
      // Preserve old URL structures
      { source: '/pages/all-exams.html', destination: '/all-exams', permanent: true },
      { source: '/pages/exam-calendar.html', destination: '/exam-calendar', permanent: true },
      { source: '/pages/quiz.html', destination: '/quiz', permanent: true },
      { source: '/pages/mock-test.html', destination: '/mock-test', permanent: true },
      { source: '/pages/dashboard.html', destination: '/dashboard', permanent: true },
      { source: '/pages/exam-questions-page.html', destination: '/exam', permanent: true },
      { source: '/index.html', destination: '/', permanent: true },
    ];
  },
};

module.exports = nextConfig;
