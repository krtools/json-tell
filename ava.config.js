export default {
  files: ['test/**/*.test.ts'],
  typescript: {
    rewritePaths: {
      'test/': 'dist/test/',
      'src/': 'dist/src/'
    }
  }
};
