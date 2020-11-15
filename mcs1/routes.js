const Router  = require('koa-router');
const xmlParser  = require('koa-xml-body');
const service = require('./service');

const router = new Router();
const xmlOptions = {
	limit: 128000000,
	encoding: 'utf8',
	xmlOptions: { explicitArray: true },
	key: 'xmlBody',
	onerror: (err, ctx) => ctx.throw(err.status, err.message),
}

router
	.get('/status/:id', service.getDocStatus)
	.post('/', xmlParser(xmlOptions), service.uploadXML)
;

module.exports = router;
