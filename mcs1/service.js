const broker = require('./broker');
const dbase = require('./dbase');

const parse = (xml, _id) => {
	let collectionName, collectionCode
	let sectionName, sectionCode
	let subSectionName, subSectionCode
	let tableName, tableCode
	let counter = 0;
	const push = () => {
		counter++;
		broker.sendDocInstance(_id, {
			collectionName,
			collectionCode,
			sectionName,
			sectionCode,
			subSectionName,
			subSectionCode,
			tableName,
			tableCode,
		});
	}
	xml.forEach(el => {
		collectionName = el['$'].Name;
		collectionCode = el['$'].Code;
		sectionName = undefined;
		sectionCode = undefined;
		subSectionName = undefined;
		subSectionCode = undefined;
		tableName = undefined;
		tableCode = undefined;
		if (el.Section) {
			el.Section.forEach(el => {
				sectionName = el['$'].Name;
				sectionCode = el['$'].Code;
				subSectionName = undefined;
				subSectionCode = undefined;
				tableName = undefined;
				tableCode = undefined;
				if (el.Section) {
					el.Section.forEach(el => {
						subSectionName = el['$'].Name;
						subSectionCode = el['$'].Code;
						tableName = undefined;
						tableCode = undefined;
						if (el.Section) {
							el.Section.forEach(el => {
								tableName = el['$'].Name;
								tableCode = el['$'].Code;
								push()
							})
						} else {
							push()
						}
					})
				} else {
					push()
				}
			})
		} else {
			push()
		}
	});
	broker.sendDocMeta(_id, counter);
};

module.exports = {
	getDocStatus: async (ctx) => {
		ctx.body = await dbase.getDocStatus(ctx.params.id);
	},

	uploadXML: async (ctx) => {
		const _id = await dbase.createNewDoc();
		ctx.res.statusCode = 200;
		ctx.res.end(JSON.stringify(_id));
		await broker.setDocQueue(_id);
		parse(ctx.request.xmlBody.base.ResourcesDirectory[0].ResourceCategory[0].Section, _id);
	},
}
