import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validácia vstupov
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');

  // CORS pre mobil/web klienta
  app.enableCors({
    origin: true, // odrazí Origin z requestu (alebo si sem daj konkrétne domény)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Voliteľné: prefix pre všetky routy => /api/...
  // app.setGlobalPrefix('api');

  const port = Number(process.env.PORT) || 3000;

  // '0.0.0.0' = dostupné aj z iných zariadení v LAN (telefon, tablet)
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API beží na http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
