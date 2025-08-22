// backend/api/test/app.e2e-spec.ts
import request, { type Response } from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { type Server } from 'http';

describe('App (e2e)', () => {
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 👇 getHttpServer() je typované ako any → pretypujeme na Node Server
    server = app.getHttpServer() as unknown as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns ok', () => {
    return request(server)
      .get('/health')
      .expect(200)
      .expect((res: Response) => {
        const body = res.body as { ok?: boolean };
        if (!body?.ok) {
          throw new Error('Response missing { ok: true }');
        }
      });
  });
});
