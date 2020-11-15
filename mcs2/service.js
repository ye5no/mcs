const broker = require('./broker');
const dbase = require('./dbase');

module.exports = {
	queueLength: async (ctx) => {
		ctx.body = await broker.getQueueLength();
	},

	norms: async (ctx) => {
		ctx.body = await dbase.list(ctx.query.offset, ctx.query.limit);
	},
}
