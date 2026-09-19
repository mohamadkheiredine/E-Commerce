import request from 'supertest';
import { createApp } from '../app.js';

/** One app instance per test file; supertest binds an ephemeral port per call. */
export const app = createApp();
export const api = () => request(app);

export async function loginAs(email: string, password: string) {
  const res = await api().post('/api/v1/auth/login').send({ email, password });
  if (res.status !== 200) {
    throw new Error(`loginAs failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data as { accessToken: string; refreshToken: string; user: { id: string } };
}
