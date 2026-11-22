/** @fileoverview Server test setup. */
process.env['NODE_ENV'] = 'test';
process.env['PORT'] = '0';
delete process.env['GEMINI_API_KEY'];

