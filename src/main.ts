import { NestFactory } from '@nestjs/core';
import { useContainer } from 'class-validator';
import { MovementsValidationModule } from './movements-validation/movements-validation.module';

async function bootstrap() {
  const app = await NestFactory.create(MovementsValidationModule);
  useContainer(app.select(MovementsValidationModule), { fallbackOnErrors: true });
  const port = process.env.NESTJS_PORT ?? 3000;
  console.log(3000);
  await app.listen(port);
}
bootstrap();
