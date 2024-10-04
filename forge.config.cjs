module.exports = {
  packagerConfig: {
    ignore: [
      /(.eslintrc.json)|(.gitignore)|(electron.vite.config.ts)|(forge.config.cjs)|(tsconfig.*)/,
      /^\/node_modules\/.vite/,
      /^\/.git/,
      /^\/.github/,
      /^\/app/,
      /^\/php/
    ],
    asar: true,
    extraResource: [
      "./app/",
      "./php/",
      "./LICENSE",
      "./README.md"
    ]
  },
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {}
    }
  ],
  makers: [
    {
      name: "@electron-forge/maker-zip",
      platforms: [
        'win32',
        "linux"
      ]
    }
  ],
  hooks: {
    postPackage: async (config, buildPath) => {
      const path = require('path')
      const fs = require('fs');

      const outputPath = buildPath.outputPaths.toString();
      const platform = buildPath.platform.toString();

      if (platform === 'win32') {
        fs.rmSync(path.join(outputPath, '/resources/php/linux/'), { recursive: true, force: true });
      } else if (platform === 'linux') {
        fs.rmSync(path.join(outputPath, '/resources/php/win32/'), { recursive: true, force: true });
      }
    }
  },
  publishers: []
}