import { EntitySchema, OptionalProps, EntitySchemaMetadata } from "@mikro-orm/core"
import { ObjectSchema, BaseSchema, Output, Input } from "valibot"
import { schemaEntityNameMap } from "../utils/schemaEntityNameMap"
import { getProperties } from "./getProperties"

export function toEntitySchema<T extends ObjectSchema<any>, Base = never>(
	metaOrName: string | EntitySchemaMetadata<InferEntity<T>, Base>,
	schema: T,
): EntitySchema<InferEntity<T>> {
	const { name, meta } = (() => {
		if (typeof metaOrName === "string") return { name: metaOrName, meta: undefined }
		const name = metaOrName.name ?? metaOrName.class?.name
		return { name, meta: metaOrName }
	})()
	if (schema.type !== "object")
		throw new Error(`🚫 ${schema.type} schema is not supported! Please use an object schema`)
	if (name == null) throw new Error("🚫 Entity schema must have a name!")
	schemaEntityNameMap.set(schema, name)
	const properties = { ...getProperties(schema), ...meta?.properties }
	return new EntitySchema({ ...meta, name, properties } as any)
}

export type InferEntity<T extends BaseSchema | EntitySchema> = T extends BaseSchema
	? Output<T> & {
			[OptionalProps]: DiffKeys<NonNullishKeys<Output<T>>, NonNullishKeys<Input<T>>>
	  }
	: T extends EntitySchema<infer Entity>
	  ? Entity
	  : never

type NonNullishKeys<T extends Record<string, any>> = NonNullable<
	{
		[K in keyof T]: undefined extends T[K] ? never : null extends T[K] ? never : K
	}[keyof T]
>

type DiffKeys<T extends string | number | symbol, U extends string | number | symbol> = ({ [P in T]: P } & {
	[P in U]: never
} & {
	[x: string]: never
})[T]
