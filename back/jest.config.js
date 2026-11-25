// Tests unitarios (archivos .spec.ts en src) y de punta a punta (.e2e-spec.ts en test).
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.(spec|e2e-spec)\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/test/entorno.ts'],
  testTimeout: 20000,
};
