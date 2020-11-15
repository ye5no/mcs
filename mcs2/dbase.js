const mongoose = require('mongoose');

class Dbase {
	constructor(cfg) {
		this.connected = false;
		this.init(cfg);
	}

	async init(cfg) {
		try {
			await mongoose.connect(cfg, {
				useNewUrlParser: true,
				useCreateIndex: true,
				useUnifiedTopology: true,
				retryWrites: false,
			});
			const schema = new mongoose.Schema({
				collectionName: 'string',
				collectionCode: 'string',
				sectionName: 'string',
				sectionCode: 'string',
				subSectionName: 'string',
				subSectionCode: 'string',
				tableName: 'string',
				tableCode: 'string',
			});
			this.model = mongoose.model('norms', schema);
			this.connected = true;
			console.log(`Dbase connected on ${cfg}`);
		} catch (e) {
			console.log(e);
			process.exit(99999);
		}
	}

	write(batch) {
		return this.model.insertMany(batch);
	}

	async list(offset = 0, limit = 10) {
		const total = await this.model.countDocuments();
		const rows = await this.model.find().skip(+offset).limit(+limit);
		return { total, limit, offset, rows };
	}
}

const db = new Dbase(process.env.MONGO);
module.exports = db;
