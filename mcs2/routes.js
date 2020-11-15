const Router  = require('koa-router');
const service = require('./service');

const router = new Router();

router
	.get('/queueLength', service.queueLength)
	.get('/norms', service.norms)
;

module.exports = router;
