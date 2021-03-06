import { throwForbiddenError } from '#lib/validation'
import { UserEntity } from '#src/db/entity'

import { profileEndpoint, ProfilePatchProps } from './profile.api.lib'

export default async function profilePlugin(app: FastifyInstance, options: FastifyOptions) {
	app.get(profileEndpoint, async function getProfile(req, reply) {
		const 
			id = req.user.id
			,user = await UserEntity.findOne({id}) || throwForbiddenError()
		reply.send(user)
	})
	app.patch(profileEndpoint, async function patchProfile(req, reply) {
		const 
			{id} = req.params as Record<string, string>
			,user = await UserEntity.findOne({id}) || throwForbiddenError()
			,props = new ProfilePatchProps(req.body)
		Object.assign(user, props)
		await user.saveSafe()
		reply.code(204).send()
	})
	app.delete(profileEndpoint, async function deleteProfile(req, reply) {
		const 
			{id} = req.params as Record<string, string>
			,user = await UserEntity.findOne({id}) || throwForbiddenError()
		await user.softRemove()
		reply.code(204).send()
	})
}