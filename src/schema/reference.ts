import { EntitySchema, EntitySchemaProperty, Ref } from "@mikro-orm/core"
import { type BaseSchema, type Input, type Output, actionOutput } from "valibot"
import { InferEntity } from "../function/defineEntitySchema"
import { getterEntityName } from "../utils/schemaEntityNameMap"

/**
 * Mikro Reference schema type.
 */
export type ReferenceSchema<
	Target extends BaseSchema | EntitySchema = any,
	Owner = any,
	TOutput = Target extends BaseSchema ? Output<Target> : InferEntity<Target>,
> = BaseSchema<Target extends BaseSchema ? Input<Target> : InferEntity<Target>, Ref<TOutput>> & {
	/**
	 * The schema type.
	 */
	type: "mikro_reference"
	/**
	 * The schema getter.
	 */
	getter: () => Target

	/**
	 * The metadata for property.
	 */
	meta: EntitySchemaProperty<TOutput, Owner>
}

/**
 * Creates a Mikro reference schema.
 *
 * @param getter The schema getter.
 *
 * @param meta The metadata for property.
 *
 * @returns A Mikro reference schema.
 */
export function reference<Target extends BaseSchema | EntitySchema = any, Owner = any>(
	getter: () => Target,
	meta: EntitySchemaProperty<Target extends BaseSchema ? Output<Target> : InferEntity<Target>, Owner>,
): ReferenceSchema<Target, Owner> {
	return {
		type: "mikro_reference",
		async: false,
		meta: {
			ref: true,
			...meta,
		},
		getter,
		_parse(input, info) {
			const target = this.getter()
			if (target instanceof EntitySchema) return actionOutput(input)
			return target._parse(input, info) as any
		},
	}
}

/**
 * Creates a Mikro OneToOne schema.
 *
 * @param getter The schema getter.
 *
 * @param meta The metadata for property.
 *
 * @returns A Mikro OneToOne schema.
 */
export function oneToOne<Target extends BaseSchema | EntitySchema = any, Owner = any>(
	getter: () => Target,
	meta?: Partial<
		Extract<
			EntitySchemaProperty<Target extends BaseSchema ? Output<Target> : InferEntity<Target>, Owner>,
			{ kind: "1:1" }
		>
	>,
): ReferenceSchema<Target, Owner> {
	return reference(getter, {
		kind: "1:1",
		entity: getterEntityName(getter),
		...meta,
	})
}

/**
 * Creates a Mikro OneToOne schema.
 *
 * @param getter The schema getter.
 *
 * @param meta The metadata for property.
 *
 * @returns A Mikro OneToOne schema.
 */
export function manyToOne<Target extends BaseSchema | EntitySchema = any, Owner = any>(
	getter: () => Target,
	meta?: Partial<
		Extract<
			EntitySchemaProperty<Target extends BaseSchema ? Output<Target> : InferEntity<Target>, Owner>,
			{ kind: "1:1" }
		>
	>,
): ReferenceSchema<Target, Owner> {
	return reference(getter, {
		kind: "m:1",
		entity: getterEntityName(getter),
		...meta,
	})
}
