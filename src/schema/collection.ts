import { Collection, EntitySchema, EntitySchemaProperty } from "@mikro-orm/core"
import { type BaseSchema, type Input, type Output, actionOutput } from "valibot"
import { InferEntity } from "../function/defineEntitySchema"
import { getterEntityName } from "../utils/schemaEntityNameMap"

/**
 * Collection schema type.
 */
export type CollectionSchema<
	Target extends BaseSchema | EntitySchema = any,
	Owner = any,
	TOutput = Target extends BaseSchema ? Output<Target> : InferEntity<Target>,
> = BaseSchema<
	Target extends BaseSchema ? Input<Target> : InferEntity<Target>,
	TOutput extends object ? Collection<TOutput> : TOutput
> & {
	/**
	 * The schema type.
	 */
	type: "mikro_collection"
	/**
	 * The schema getter.
	 */
	getter: () => Target

	/**
	 * The metadata for property.
	 */
	meta: Extract<EntitySchemaProperty<TOutput, Owner>, { kind: "m:n" | "1:m" }>
}

/**
 * Creates a collection schema.
 *
 * @param getter The schema getter.
 *
 * @returns A collection schema.
 */
export function collection<Target extends BaseSchema | EntitySchema = any, Owner = any>(
	getter: () => Target,
	meta: Extract<
		EntitySchemaProperty<Target extends BaseSchema ? Output<Target> : InferEntity<Target>, Owner>,
		{ kind: "m:n" | "1:m" }
	>,
): CollectionSchema<Target, Owner> {
	return {
		type: "mikro_collection",
		async: false,
		meta,
		getter,
		_parse(input, info) {
			const target = this.getter()
			if (target instanceof EntitySchema) return actionOutput(input)
			return target._parse(input, info) as any
		},
	}
}

/**
 * Creates a manyToMany schema.
 *
 * @param getter The schema getter.
 *
 * @returns A manyToMany schema.
 */
export function manyToMany<Target extends BaseSchema | EntitySchema = any, Owner = any>(
	getter: () => Target,
	meta?: Partial<
		Extract<
			EntitySchemaProperty<Target extends BaseSchema ? Output<Target> : InferEntity<Target>, Owner>,
			{ kind: "m:n" }
		>
	>,
): CollectionSchema<Target, Owner> {
	return collection(getter, {
		kind: "m:n",
		entity: getterEntityName(getter),
		...meta,
	})
}

/**
 * Creates a oneToMany schema.
 *
 * @param getter The schema getter.
 *
 * @returns A oneToMany schema.
 */
export function oneToMany<Target extends BaseSchema | EntitySchema = any, Owner = any>(
	getter: () => Target,
	meta: Omit<
		Extract<
			EntitySchemaProperty<Target extends BaseSchema ? Output<Target> : InferEntity<Target>, Owner>,
			{ kind: "1:m" }
		>,
		"kind" | "entity"
	> &
		Partial<
			Pick<
				Extract<
					EntitySchemaProperty<Target extends BaseSchema ? Output<Target> : InferEntity<Target>, Owner>,
					{ kind: "1:m" }
				>,
				"kind" | "entity"
			>
		>,
): CollectionSchema<Target, Owner> {
	return collection(getter, {
		kind: "1:m",
		entity: getterEntityName(getter),
		...meta,
	})
}
