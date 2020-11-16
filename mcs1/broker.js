const amqp = require('amqplib');
const dbase = require('./dbase');

class Broker {
	constructor(cfg) {
		this.connected = false;
		this.init(cfg);
	}

	async init(cfg) {
		try {
			const broker = await amqp.connect(cfg);
			this.channel = await broker.createChannel();
			this.connected = true;
			console.log(`Broker connected on ${cfg}`);

			await this.channel.assertQueue('docs', { durable: true });
			await this.channel.assertQueue('status', { durable: true });
			this.channel.consume('status', this.finalize.bind(this), { noAck: false });
		} catch (e) {
			console.log(e);
			process.exit(99998);
		}
	}

	setDocQueue(_id) {
		this.channel.assertQueue(`doc.${_id}`, { durable: true });
	}

	sendDocInstance(_id, data) {
		this.channel.sendToQueue(`doc.${_id}`, Buffer.from(JSON.stringify(data)))
	}

	sendDocMeta(_id, counter) {
		this.channel.sendToQueue(`docs`, Buffer.from(JSON.stringify({_id, counter})))
	}

	finalize(msg) {
		try {
			const _id = msg.content.toString();
			console.log(`${_id} FINISHED`);
			dbase.finishDoc(_id);
			this.channel.ack(msg);
		} catch (err) {
			console.log(err);
			this.channel.nack(msg)
			throw err
		}
	}
}

const broker = new Broker(process.env.AMQP);
module.exports = broker;
