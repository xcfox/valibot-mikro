import type { BaseValidation } from "valibot"
import { actionOutput } from "valibot"
import { EntitySchemaProperty } from "@mikro-orm/core"

/**
 * Custom validation type.
 */
export type PropertyMeta<Entity = any, TInput = any> = BaseValidation<TInput> & {
	/**
	 * The validation type.
	 */
	type: "mikro-property"

	/**
	 * The property meta.
	 */
	meta?: Partial<EntitySchemaProperty<TInput, Entity>>
}

/**
 * Add more information to the property.
 *
 * @returns A validation action.
 */
export function property<Entity = any, TInput = any>(
	meta?: Partial<EntitySchemaProperty<TInput, Entity>>,
): PropertyMeta<Entity, TInput> {
	return {
		type: "mikro-property",
		async: false,
		meta,
		message: "mikro property meta",
		_parse(input) {
			return actionOutput(input)
		},
	}
}
