import type { ConnectionOptions } from 'typeorm'
import { createConnection as tCreateConnection } from 'typeorm'

import config from '../lib/config.node'

/**
 * Calls a memoized typeorm.createConnection. By memoizing, it can be 
 * called from anywhere without worrying about opening multiple connections.
 */
export default function createConnection() {
	return createConnectionM()
		.catch(e => {
			createConnectionM.bust()
			throw (
				e.message.startsWith('Communications link failure') && new DbConnectionError ||
				e
			)
		})
}

/**
 * Calls typeorm.createConnection with the proper config. On local, Typeorm
 * will just check <root>/ormconfig.js.
 * 
 * I tried to add logic in ormconfig.js to switch based on env, but Lambda 
 * barfed for some reason.
 */
async function createConnectionRaw() {
	return config.isProd ? tCreateConnection(prodOrmconfig) : tCreateConnection()
}

/**
 * Memoize createConnection so that it can be called from anywhere without
 * worrying about opening multiple connections.
 */
const createConnectionM = Function.memoize(createConnectionRaw)


const prodOrmconfig: ConnectionOptions = {
	type: 'aurora-data-api',
	region: config.region,
	secretArn: config.dbSecretArn,
	resourceArn: config.dbArn,
	database: config.dbName,
	serviceConfigOptions: { maxRetries: 1 },
	// synchronize: true,
	migrationsRun: true,
	entities: 		['src/db/entity/**/entity.node.js'],
	migrations: 	['src/db/migration/**/*.js'],
	subscribers: 	['src/db/subscriber/**/*.js'],
}

export class DbConnectionError extends Error {
	type = 'DbConnectionError'
	note = 'The DB is unavailable'
	context = {
		entity: null,
		errorSet: {}
	}
	constructor() {
		super('The DB is unavailable')
	}
}