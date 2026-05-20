import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { EntityCaseNamingStrategy, MikroORM } from '@mikro-orm/core';
import { AuthModule } from '../../src/auth/auth.module';
import { AuthService } from '../../src/auth/auth.service';
import { User } from '../../src/entities/user.entity';
import { Role } from '../../src/entities/role.entity';
import { UserRole } from '../../src/entities/user-role.entity';
import { ormEntities } from '../../src/mikro-orm/orm-entities';
import { hash } from 'bcryptjs';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let orm: MikroORM;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MikroOrmModule.forRoot({
          entities: [...ormEntities],
          dbName: ':memory:',
          driver: SqliteDriver,
          namingStrategy: EntityCaseNamingStrategy,
          allowGlobalContext: true,
        }),
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    orm = moduleFixture.get(MikroORM);
    await orm.getSchemaGenerator().refreshDatabase();
  });

  afterAll(async () => {
    await orm.getSchemaGenerator().dropSchema();
    await app.close();
  });

  describe('POST /auth/admin/login', () => {
    it('should return 401 when credentials are invalid', async () => {
      return request(app.getHttpServer())
        .post('/auth/admin/login')
        .send({ email: 'invalid@test.com', password: 'wrong' })
        .expect(401);
    });

    it('should return 401 when email is missing', async () => {
      return request(app.getHttpServer())
        .post('/auth/admin/login')
        .send({ password: 'test' })
        .expect(401);
    });

    it('should login successfully with valid credentials', async () => {
      const em = orm.em.fork();

      const role = new Role();
      role.name = 'admin';
      role.displayName = 'Admin';
      role.isActive = true;
      em.persist(role);
      await em.flush();

      const user = new User();
      user.email = 'admin@test.com';
      user.name = 'Admin User';
      user.password = await hash('password123', 10);
      user.isActive = true;
      em.persist(user);
      await em.flush();

      const userRole = new UserRole();
      userRole.user = user;
      userRole.role = role;
      em.persist(userRole);
      await em.flush();

      return request(app.getHttpServer())
        .post('/auth/admin/login')
        .send({ email: 'admin@test.com', password: 'password123' })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.email).toBe('admin@test.com');
          expect(res.body.data.roles).toHaveLength(1);
        });
    });
  });

  describe('GET /auth/admin/me', () => {
    it('should return 401 when X-User-Id header is missing', async () => {
      return request(app.getHttpServer()).get('/auth/admin/me').expect(401);
    });

    it('should return 404 when user not found', async () => {
      return request(app.getHttpServer())
        .get('/auth/admin/me')
        .set('X-User-Id', 'non-existent-id')
        .expect(404);
    });
  });

  describe('POST /auth/admin/logout', () => {
    it('should logout successfully', async () => {
      return request(app.getHttpServer())
        .post('/auth/admin/logout')
        .send({ userId: 'user-1' })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.ok).toBe(true);
        });
    });
  });
});
