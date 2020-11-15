const logger  = require('koa-logger');
const bodyParser  = require('koa-bodyparser');

module.exports = (app) => {
	app.use(logger());
	app.use(bodyParser());
	app.use(async (ctx, next) => {
		try {
			await next();
		} catch (err) {
			console.error(err);
			const { status = 500, message = 'Server Error' } = err;
			ctx.status = status;
			ctx.body = { status, message };
		}
	});
};
