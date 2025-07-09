/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },

  env: {
    NEXT_PUBLIC_RAILS_API_URL: 'https://api-plusoneup.com',
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push(({ context, request }, callback) => {
        if (/jest/.test(request)) {
          return callback(null, 'commonjs ' + request);
        }
        callback();
      });

      config.module.rules.push({
        test: /\.(test|spec)\.js$/,
        use: 'ignore-loader'
      });

      config.module.rules.push({
        test: /\/pages\/.*\.(test|spec)\.js$/,
        use: 'ignore-loader'
      });
    }

    return config;
  },
  // Additional Next.js config options here
};

module.exports = nextConfig;
