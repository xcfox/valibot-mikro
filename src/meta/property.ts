import { EntitySchemaProperty } from "@mikro-orm/core"
import type { BaseValidation } from "valibot"
import { actionOutput } from "valibot"

/**
 * Mikro property meta.
 */
export type PropertyMeta<Entity = any, TInput = any> = BaseValidation<TInput> & {
	/**
	 * The validation type.
	 */
	type: "mikro_property"

	/**
	 * The property meta.
	 */
	meta?: Partial<EntitySchemaProperty<TInput, Entity>>
}

/**
 * Add more information to the property.
 *
 * @param meta The property meta.
 *
 * @returns A property meta.
 */
export function property<Entity = any, TInput = any>(
	meta?: Partial<EntitySchemaProperty<TInput, Entity>>,
): PropertyMeta<Entity, TInput> {
	return {
		type: "mikro_property",
		async: false,
		meta,
		message: "mikro property meta",
		_parse(input) {
			return actionOutput(input)
		},
	}
}

/**
 * `formula()` is used to define entity's property that is not persisted into the database.
 *
 * @param formula SQL fragment that will be part of the select clause..
 *
 * @returns A property meta.
 */
export function formula(formula: string | (() => string)) {
	return property({ formula })
}

/**
 * `primaryKey()` is used to define entity's unique primary key identifier.
 *
 * @param meta The property meta.
 *
 * @returns A property meta.
 */
export function primaryKey<Entity = any, TInput = any>(meta?: Partial<EntitySchemaProperty<TInput, Entity>>) {
	return property<Entity, TInput>({ ...meta, primary: true })
}

/**
 * Property marked with `serializedPrimaryKey()` is virtual, it will not be persisted into the database.
 *
 * @param meta The property meta.
 *
 * @returns A property meta.
 */
export function serializedPrimaryKey<Entity = any, TInput = any>(meta?: Partial<EntitySchemaProperty<TInput, Entity>>) {
	return property<Entity, TInput>({ ...meta, serializedPrimaryKey: true })
}

/**
 * Explicitly specify index on a property.
 *
 * @returns A property meta.
 */
export function index<Entity = any, TInput = any>(index: string | true = true) {
	return property<Entity, TInput>({ index })
}

/**
 * Explicitly specify unique constraint on a property.
 *
 * @returns A property meta.
 */
export function unique<Entity = any, TInput = any>(unique: string | true = true) {
	return property<Entity, TInput>({ unique })
}
