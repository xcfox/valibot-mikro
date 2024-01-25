import { EntitySchema, EntitySchemaMetadata, EventArgs, OptionalProps } from "@mikro-orm/core"
import { BaseSchema, Input, ObjectEntries, ObjectSchema, Output } from "valibot"
import { BASE_REF } from "../utils/baseRef"
import { schemaEntityNameMap } from "../utils/schemaEntityNameMap"
import { getProperties } from "./getProperties"

// TODO: 支持直接传入 TEntries extends ObjectEntries
export function defineEntitySchema<T extends ObjectSchema<any> | ObjectEntries, Base = never>(
	metaOrName:
		| string
		| EntitySchemaMetadata<
				T extends ObjectSchema<any> ? InferEntity<T> : T extends ObjectEntries ? InferEntity<ObjectSchema<T>> : never,
				Base
		  >,
	schema: T & {
		[BASE_REF]?: BaseSchema
	},
): EntitySchema<
	T extends ObjectSchema<any> ? InferEntity<T> : T extends ObjectEntries ? InferEntity<ObjectSchema<T>> : never
> {
	const { name, meta } = (() => {
		if (typeof metaOrName === "string") return { name: metaOrName, meta: undefined }
		const name = metaOrName.name ?? metaOrName.class?.name
		return { name, meta: metaOrName }
	})()

	if (name == null) throw new Error("🚫 Entity schema must have a name!")

	// register schema name
	schemaEntityNameMap.set(schema, name)
	if (schema[BASE_REF] != null) {
		schemaEntityNameMap.set(schema[BASE_REF], name)
	}

	const [propertiesFromSchema, defaultValueMap] = getProperties(isObjectSchema(schema) ? schema.entries : schema)
	const properties: any = { ...propertiesFromSchema, ...meta?.properties }

	// set default value to properties on init
	const hooks = meta?.hooks ?? {}
	const onInit = hooks.onInit ?? []
	onInit.unshift(({ entity }: EventArgs<any>) => {
		for (const [key, defaultValue] of defaultValueMap) {
			if (entity[key] === undefined) {
				const value = typeof defaultValue === "function" ? defaultValue() : defaultValue
				entity[key] = value
			}
		}
	})
	hooks.onInit = onInit
	return new EntitySchema({ ...meta, hooks, name, properties })
}

function isObjectSchema(schema: any): schema is ObjectSchema<any> {
	return schema.type === "object"
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
