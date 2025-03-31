/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },

  env: {
    NEXT_PUBLIC_RAILS_API_URL: 'https://rails-alb-2146908755.ap-northeast-1.elb.amazonaws.com',
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
