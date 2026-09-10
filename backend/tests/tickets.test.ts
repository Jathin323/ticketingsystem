import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

async function createSampleTicket(overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/tickets')
    .send({
      customerName: 'Test Customer',
      title: 'Test ticket',
      description: 'Something is broken',
      priority: 'High',
      ...overrides,
    });
  return res;
}

describe('Tickets API', () => {
  beforeAll(async () => {
    // A couple of baseline tickets for list/filter tests.
    await createSampleTicket({ customerName: 'Alpha', priority: 'Low', title: 'Alpha issue' });
    await createSampleTicket({ customerName: 'Beta', priority: 'High', title: 'Beta outage' });
  });

  it('creates a ticket and defaults status to Open', async () => {
    const res = await createSampleTicket();
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ status: 'Open', priority: 'High' });
    expect(res.body.id).toBeGreaterThan(0);
    expect(res.body.createdAt).toBeTruthy();
  });

  it('rejects a ticket with missing fields (400 + details)', async () => {
    const res = await request(app).post('/api/tickets').send({ title: 'no customer' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(Array.isArray(res.body.details)).toBe(true);
  });

  it('rejects an invalid priority value', async () => {
    const res = await createSampleTicket({ priority: 'Urgent' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for a non-numeric id', async () => {
    const res = await request(app).get('/api/tickets/abc');
    expect(res.status).toBe(400);
  });

  it('returns 404 for a missing ticket', async () => {
    const res = await request(app).get('/api/tickets/999999');
    expect(res.status).toBe(404);
  });

  it('lists tickets with pagination metadata', async () => {
    const res = await request(app).get('/api/tickets?pageSize=2&page=1');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.pagination).toMatchObject({ page: 1, pageSize: 2 });
    expect(res.body.pagination.total).toBeGreaterThan(0);
  });

  it('filters by priority', async () => {
    const res = await request(app).get('/api/tickets?priority=Low&pageSize=100');
    expect(res.status).toBe(200);
    expect(res.body.data.every((t: { priority: string }) => t.priority === 'Low')).toBe(true);
  });

  it('searches by customer name', async () => {
    const res = await request(app).get('/api/tickets?search=Beta&pageSize=100');
    expect(res.status).toBe(200);
    expect(res.body.data.some((t: { customerName: string }) => t.customerName === 'Beta')).toBe(true);
  });

  it('updates a ticket status and bumps updatedAt', async () => {
    const created = await createSampleTicket();
    const before = created.body.updatedAt;
    await new Promise((r) => setTimeout(r, 5));
    const res = await request(app)
      .put(`/api/tickets/${created.body.id}`)
      .send({ status: 'Resolved' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Resolved');
    expect(res.body.updatedAt >= before).toBe(true);
  });

  it('rejects an empty update body', async () => {
    const created = await createSampleTicket();
    const res = await request(app).put(`/api/tickets/${created.body.id}`).send({});
    expect(res.status).toBe(400);
  });

  it('deletes a ticket', async () => {
    const created = await createSampleTicket();
    const del = await request(app).delete(`/api/tickets/${created.body.id}`);
    expect(del.status).toBe(204);
    const after = await request(app).get(`/api/tickets/${created.body.id}`);
    expect(after.status).toBe(404);
  });

  it('adds and lists comments', async () => {
    const created = await createSampleTicket();
    const add = await request(app)
      .post(`/api/tickets/${created.body.id}/comments`)
      .send({ author: 'Agent', body: 'Looking into it' });
    expect(add.status).toBe(201);
    const list = await request(app).get(`/api/tickets/${created.body.id}/comments`);
    expect(list.body.length).toBe(1);
  });
});
