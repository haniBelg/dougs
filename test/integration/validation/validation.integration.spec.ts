import { Balance, Movement } from '@banking/model';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { useContainer } from 'class-validator';
import * as fs from 'fs';
import * as path from 'path';
import * as request from 'supertest';
import { MovementsValidationModule } from './../../../src/movements-validation/movements-validation.module';
type TestData = {
  request: { movements: Movement[]; balances: Balance[] };
  response: any;
  status: number;
};
describe('AppController (Integration) - parametrized test', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MovementsValidationModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    useContainer(moduleFixture, { fallbackOnErrors: true });
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });

  // Dynamically load all test files from the 'samples' directory
  const sampleDirectory = path.resolve(__dirname, './samples');
  const sampleFiles = fs
    .readdirSync(sampleDirectory)
    .filter((file) => file.endsWith('.json'));

  // Read and parse each JSON file to use as test data
  const testDataArray = sampleFiles.map((file) => {
    const filePath = path.join(sampleDirectory, file);
    const testData: TestData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return { fileName: file, testData };
  });

  // Run a parameterized test for each set of test data
  test.each(testDataArray)(
    'POST /movements/validation with %s',
    async ({ fileName, testData }) => {
      return request(app.getHttpServer())
        .post('/movements/validation')
        .send(testData.request)
        .expect(testData.status)
        .expect(testData.response);
    },
  );

});
