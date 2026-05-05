// fixtures/test-data.ts

export const TEST_USER = {
  name:     'Test User',
  email:    'playwright@example.com',
  password: 'playwright',
};

export const CATEGORIES = {
  valid: {
    name: 'Category Name',
  },
  updated: {
    name: 'Updated Category Name',
  },
  empty: {
    name: '',
  },
};

export const POSTS = {
  valid: {
    title: 'My First Post',
    text: 'Content for the post.',
  },
  updated: {
    title: 'My Updated Post',
    text: 'Updated content for the post.',
  },
  empty: {
    title: '',
    text: '',
  },
};

export const ROUTES = {
  login:     '/login',
  register:  '/register',
  dashboard: '/dashboard',
  profile:   '/profile',
  categories: { index: '/categories', create: '/categories/create' },
  posts: { index: '/posts', create: '/posts/create' },
};