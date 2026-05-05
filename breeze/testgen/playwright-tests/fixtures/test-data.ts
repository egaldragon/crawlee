// fixtures/test-data.ts

export const TEST_USER = {
    name: 'Test User',
    email: 'playwright@example.com',
    password: 'playwright',
};

export const CATEGORIES = {
  valid: {
    name: 'Sample Name',
  },
  updated: {
    name: 'Updated Name',
  },
  empty: {
    name: '',
  },
};

export const POSTS = {
  valid: {
    title: 'Sample Title',
    text: 'Sample text value.',
    category_id: 'Sample Value',
  },
  updated: {
    title: 'Updated Title',
    text: 'Updated text value.',
    category_id: 'Updated Value',
  },
  empty: {
    title: '',
    text: '',
    category_id: '',
  },
};

export const ROUTES = {
    login: '/login',
    register: '/register',
    dashboard: '/dashboard',
    profile: '/profile',
  categories: { index: '/categories', create: '/categories/create' },
  posts: { index: '/posts', create: '/posts/create' },
};
