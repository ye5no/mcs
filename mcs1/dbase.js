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
			const schema = new mongoose.Schema({ status: 'string' });
			this.model = mongoose.model('docs', schema);
			this.connected = true;
			console.log(`Dbase connected on ${cfg}`);
		} catch (e) {
			console.log(e);
			process.exit(99999);
		}
	}

	async getDocStatus(id) {
		let res
		const nf = { status: 'NOT FOUND' }
		try {
			res = await this.model.findById(id);
			res = res || nf;
		} catch (e) {
			res = nf
		}
		return res.status;
	}

	async createNewDoc() {
		const xml = new this.model({ status: 'PARSING' });
		return (await xml.save())._id;
	}

	finishDoc(_id) {
		return this.model.updateOne({ _id }, { status: 'FINISHED' });
	}
}

const db = new Dbase(process.env.MONGO);
module.exports = db;
