import * as newman from 'newman';
import * as path from 'path';

describe('E2E Test with Postman and Newman', () => {
  it('should run Postman collection with Newman', (done) => {
    const collectionPath = path.resolve(__dirname, 'validation_e2e_collection.json');

    newman.run(
      {
        collection: require(collectionPath),
        reporters: 'cli',
        //   environment: require(path.resolve(__dirname, 'your-environment.postman_environment.json')), // Optional: If you have an environment file
      },
      (err, summary) => {
        // console.log(err, summary);
        if (summary.run.failures.length > 0) {
          console.error(
            'Collection run encountered an error:',
            summary.run.failures.map((f) => f.error.message),
          );
          return done(summary.run.failures.map((f) => f.error.message));
        }

        console.log('Collection run complete!');
        console.log(`Total requests: ${summary.run.stats.requests.total}`);
        done();
      },
    );
  }, 70000);
});

