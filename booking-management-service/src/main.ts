import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix('api/booking');

  const config = new DocumentBuilder()
    .setTitle('Booking Management Service')
    .setDescription('Apis for creating and confirming reservations')
    .setVersion('1.0')
    .addTag('bookings')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/spec', app, documentFactory);

  const port = process.env.PORT || 3000;
  const address = process.env.BIND_ADDRESS || '0.0.0.0';
  await app.listen(port, address);
  console.log(`Application is running on: http://${address}:${port}/api`);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
