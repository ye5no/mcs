const amqp = require('amqplib');
const dbase = require('./dbase');

class Broker {
	constructor(cfg) {
		this.connected = false;
		this.MAX_UPLOAD = 100;
		this.processDoc = null;
		this.estimated = 0;
		this.received = 0;
		this.batchNorms = [];
		this.batchAcks = [];
		this.stopMsg = null;
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
			this.channel.prefetch(1);
			this.channel.consume('docs', this.initDoc.bind(this), { noAck: false });
		} catch (e) {
			console.log(e);
			process.exit(99998);
		}
	}

	async initDoc(msg) {
		try {
			const { _id, counter } = JSON.parse(msg.content.toString());
			console.log(`-----------------${_id} start-----------------------`);
			this.processDoc = _id;
			this.estimated = counter;
			this.received = 0;
			this.batchNorms = [];
			this.stopMsg = msg;

			this.channel.assertQueue(`doc.${_id}`, { durable: true });
			this.channel.prefetch(this.MAX_UPLOAD);
			this.channel.consume(`doc.${_id}`, this.readDoc.bind(this), { noAck: false, consumerTag: _id });
		} catch (err) {
			this.channel.nack(msg)
			throw err
		}
	}

	async readDoc(msg) {
		try {
			const norm = JSON.parse(msg.content.toString());
			this.batchNorms.push(norm);
			this.batchAcks.push(msg);
			this.received++;
			if (this.batchNorms.length === this.MAX_UPLOAD) await this.acceptBatch();
			if (this.received === this.estimated) {
				await this.acceptBatch();
				this.closeQueue();
			}
		} catch (err) {
			this.channel.nack(msg)
			throw err
		}
	}

	async acceptBatch() {
		console.log(this.received);
		// await new Promise(r => setTimeout(r, 5000));
		dbase.write(this.batchNorms);
		this.batchNorms = [];
		const prevBatchAcks = this.batchAcks;
		this.batchAcks = [];
		await Promise.all(prevBatchAcks.map(msg => this.channel.ack(msg)));
	}

	async closeQueue() {
		console.log(`=================${this.processDoc} finished=======================`);
		this.channel.sendToQueue(`status`, Buffer.from(this.processDoc));
		this.channel.cancel(this.processDoc);
		this.channel.deleteQueue(`doc.${this.processDoc}`);
		this.processDoc = null;
		this.estimated = 0;
		this.received = 0;
		this.batchNorms = [];
		this.channel.prefetch(1);
		this.channel.ack(this.stopMsg);
	}

	async getQueueLength() {
		let currentCount = 0;
		const docsInfo = await this.channel.assertQueue('docs', { durable: true });
		if (this.processDoc) {
			const currentInfo = await this.channel.assertQueue(`doc.${this.processDoc}`, { durable: true });
			currentCount = currentInfo.messageCount;
		}
		return {
			docsWaitingForHandling: docsInfo.messageCount,
			remainOfCurrentDoc: currentCount,
		}
	}
}

const broker = new Broker(process.env.AMQP);
module.exports = broker;
