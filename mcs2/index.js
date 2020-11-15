require('dotenv').config();
const Koa = require('koa');
const middlewares  = require('./middlewares');

(async() => {
	let db, broker;
	while (!db) {
		db = require('./dbase').connected;
		await new Promise(r => setTimeout(r, 200));
	}
	while (!broker) {
		broker = require('./broker').connected;
		await new Promise(r => setTimeout(r, 200));
	}

	const router  = require('./routes');
	const app = new Koa();
	app
		.listen(process.env.PORT, 'localhost', async (err) => {
			try {
				middlewares(app);
				app.use(router.routes());
				console.log((err) ? err : `Routing connected on http://localhost:${process.env.PORT}`);
			} catch (e) {
				console.log(e);
				process.exit(99997);
			}
		})
		.on('error', (err) => console.log(err.stack));
})()


