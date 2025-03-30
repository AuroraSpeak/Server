import { withSentryConfig } from '@sentry/nextjs';

let userConfig = {};
try {
  userConfig = await import('./v0-user-next.config.mjs');
} catch (e) {
  console.warn('Keine User-Konfiguration gefunden, nutze Default-Konfiguration.');
}

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  webpack: (config, { isServer }) => {
    // Behandle native Module
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      path: false,
      zlib: false,
      http: false,
      https: false,
      os: false,
      url: false,
      assert: false,
      constants: false,
      buffer: false,
      process: false,
      util: false,
    };

    // Behandle .node Dateien nur serverseitig
    if (isServer) {
      config.module.rules.push({
        test: /\.node$/,
        use: 'node-loader',
      });
    } else {
      // Im Browser: Ignoriere .node Dateien
      config.module.rules.push({
        test: /\.node$/,
        use: 'null-loader',
      });
    }

    return config;
  },
};

mergeConfig(nextConfig, userConfig.default || userConfig);

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) return;

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      };
    } else {
      nextConfig[key] = userConfig[key];
    }
  }
}

const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "auraspeak",
  project: "auraspeak",
  sentryUrl: "http://localhost:8000/",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);