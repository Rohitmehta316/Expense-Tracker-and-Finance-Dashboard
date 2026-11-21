import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';
const {app}=await import('../server.js');
test('health endpoint is mounted on the API app',()=>{
 assert.equal(typeof app,'function');
 assert.ok(app._router.stack.some((layer)=>layer.route?.path==='/api/health'));
});
