import { EntityName, EntitySchema } from "@mikro-orm/core"
import { BaseSchema, ObjectEntries } from "valibot"

/** Mark a valibot schema with its corresponding mikro Entity schema name */
export const schemaEntityNameMap = new WeakMap<BaseSchema | ObjectEntries, string>()

export function getterEntityName(getter: () => BaseSchema | EntitySchema): () => EntityName<any> {
	return () => {
		const target = getter()
		if (target instanceof EntitySchema) {
			return target.name
		}
		const name = schemaEntityNameMap.get(target)
		if (!name) {
			throw new Error("🚫 No entity name found for getter")
		}
		return name
	}
}
