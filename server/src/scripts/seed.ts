import { MongoClient, ObjectId } from 'mongodb';
import { CONFIG } from '../config/index.js';

async function seed() {
  const uri = process.env.MONGO_URI || CONFIG.DEFAULT_MONGO_URI;
  console.log(`Connecting to MongoDB at ${uri}...`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected successfully!');

    // 1. E-Commerce DB
    const db = client.db('ecommerce_db');

    // Clean existing
    await db.collection('users').drop().catch(() => {});
    await db.collection('orders').drop().catch(() => {});
    await db.collection('products').drop().catch(() => {});

    console.log('Seeding ecommerce_db users...');
    const userIds = [new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId()];
    await db.collection('users').insertMany([
      {
        _id: userIds[0],
        name: 'Sarah Connor',
        email: 'sarah@cyberdyne.com',
        role: 'admin',
        status: 'active',
        totalSpend: 1450.50,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        preferences: { theme: 'dark', notifications: true }
      },
      {
        _id: userIds[1],
        name: 'John Doe',
        email: 'john@example.com',
        role: 'customer',
        status: 'active',
        totalSpend: 230.00,
        createdAt: new Date('2024-02-10T14:30:00Z'),
        preferences: { theme: 'light', notifications: false }
      },
      {
        _id: userIds[2],
        name: 'Elena Rostova',
        email: 'elena@techcorp.io',
        role: 'customer',
        status: 'active',
        totalSpend: 4890.00,
        createdAt: new Date('2024-03-01T09:15:00Z'),
        preferences: { theme: 'dark', notifications: true }
      },
      {
        _id: userIds[3],
        name: 'Marcus Vance',
        email: 'marcus@devstudio.com',
        role: 'customer',
        status: 'inactive',
        totalSpend: 45.00,
        createdAt: new Date('2023-11-20T16:45:00Z'),
        preferences: { theme: 'dark', notifications: false }
      },
      {
        _id: userIds[4],
        name: 'Aisha Sharma',
        email: 'aisha@cloudlabs.net',
        role: 'admin',
        status: 'active',
        totalSpend: 3120.75,
        createdAt: new Date('2024-01-05T11:20:00Z'),
        preferences: { theme: 'dark', notifications: true }
      }
    ]);

    console.log('Seeding ecommerce_db products...');
    await db.collection('products').insertMany([
      {
        title: 'UltraWide Curved Monitor 34"',
        category: 'Electronics',
        price: 699.99,
        stock: 42,
        ratings: 4.8,
        tags: ['monitor', 'gaming', '4k'],
        specs: { resolution: '3440x1440', refreshRate: '144Hz' }
      },
      {
        title: 'Mechanical Ergonomic Keyboard',
        category: 'Electronics',
        price: 159.50,
        stock: 120,
        ratings: 4.6,
        tags: ['keyboard', 'peripheral'],
        specs: { switchType: 'Brown', wireless: true }
      },
      {
        title: 'Noise Cancelling Headphones',
        category: 'Audio',
        price: 299.00,
        stock: 15,
        ratings: 4.9,
        tags: ['audio', 'wireless'],
        specs: { batteryLifeHours: 30, bluetooth: '5.2' }
      },
      {
        title: 'Developer Ergonomic Desk Chair',
        category: 'Furniture',
        price: 549.00,
        stock: 8,
        ratings: 4.7,
        tags: ['office', 'chair'],
        specs: { maxWeightLb: 300, material: 'Mesh' }
      }
    ]);

    console.log('Seeding ecommerce_db orders...');
    await db.collection('orders').insertMany([
      {
        orderNumber: 'ORD-2024-001',
        userId: userIds[0],
        status: 'completed',
        items: [
          { item: 'UltraWide Curved Monitor 34"', quantity: 1, price: 699.99 },
          { item: 'Mechanical Ergonomic Keyboard', quantity: 1, price: 159.50 }
        ],
        total: 859.49,
        shippingAddress: { city: 'San Francisco', country: 'USA' },
        createdAt: new Date('2024-02-01T12:00:00Z')
      },
      {
        orderNumber: 'ORD-2024-002',
        userId: userIds[2],
        status: 'completed',
        items: [
          { item: 'Developer Ergonomic Desk Chair', quantity: 2, price: 549.00 }
        ],
        total: 1098.00,
        shippingAddress: { city: 'London', country: 'UK' },
        createdAt: new Date('2024-03-02T15:30:00Z')
      },
      {
        orderNumber: 'ORD-2024-003',
        userId: userIds[1],
        status: 'processing',
        items: [
          { item: 'Noise Cancelling Headphones', quantity: 1, price: 299.00 }
        ],
        total: 299.00,
        shippingAddress: { city: 'Berlin', country: 'Germany' },
        createdAt: new Date('2024-03-10T09:10:00Z')
      }
    ]);

    // 2. Analytics DB
    const analyticsDb = client.db('analytics_db');
    await analyticsDb.collection('logs').drop().catch(() => {});
    console.log('Seeding analytics_db logs...');
    await analyticsDb.collection('logs').insertMany([
      { level: 'info', action: 'USER_LOGIN', userId: userIds[0].toString(), ip: '192.168.1.1', timestamp: new Date() },
      { level: 'warn', action: 'FAILED_ATTEMPT', userId: 'unknown', ip: '10.0.0.5', timestamp: new Date() },
      { level: 'error', action: 'PAYMENT_GATEWAY_TIMEOUT', userId: userIds[1].toString(), ip: '192.168.1.20', timestamp: new Date() },
      { level: 'info', action: 'QUERY_EXECUTED', durationMs: 14, ip: '127.0.0.1', timestamp: new Date() }
    ]);

    console.log('✅ Sample MongoDB data successfully seeded!');
  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    await client.close();
  }
}

seed();
