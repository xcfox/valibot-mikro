import { EntitySchemaMetadata, EntitySchemaProperty } from "@mikro-orm/core"
import {
	ArraySchema,
	BaseSchema,
	BigintSchema,
	BlobSchema,
	BooleanSchema,
	DateSchema,
	EnumSchema,
	RecursiveSchema,
	PicklistSchema,
	NonNullableSchema,
	NonNullishSchema,
	NonOptionalSchema,
	NullableSchema,
	NullishSchema,
	NumberSchema,
	OptionalSchema,
	Pipe,
	StringSchema,
	ObjectEntries,
} from "valibot"
import { CollectionSchema } from "../schema/collection"
import { ReferenceSchema } from "../schema/reference"

export function getProperties(
	entries: ObjectEntries,
): [EntitySchemaMetadata<any, any>["properties"], defaultValueCollector: Map<string, any>] {
	const properties = {} as any
	const defaultValueCollector = new Map<string, any>()
	Object.entries(entries).map(([key, valueSchema]) => {
		const collectDefaultValue = (defaultValue: any) => {
			defaultValueCollector.set(key, defaultValue)
		}
		const property = getProperty(valueSchema as any, collectDefaultValue)
		if (property) properties[key] = property
	})
	return [properties as EntitySchemaMetadata<any, any>["properties"], defaultValueCollector]
}

function getProperty(
	schema: BaseSchema,
	collectDefaultValue: CollectDefaultValue,
): Partial<EntitySchemaProperty<any, any>> | undefined {
	if (typeof schema !== "object") return undefined
	if (!("type" in schema)) return undefined
	const converter: PropertyConverter<any> | undefined = (propertyConverters as any)[schema.type as any]
	if (converter) return converter(schema, collectDefaultValue)
	const property = findMetaInPipe(schema as any)
	if (property) return property
}

type CollectDefaultValue = (defaultValue: any) => void

export type PresetSupportedSchemas =
	| ArraySchema<any>
	| BigintSchema
	| BlobSchema
	| BooleanSchema
	| DateSchema
	| EnumSchema<any>
	| RecursiveSchema<any>
	| PicklistSchema<any>
	| NumberSchema
	| StringSchema
	| NonNullableSchema<any>
	| NonNullishSchema<any>
	| NonOptionalSchema<any>
	| NullableSchema<any>
	| NullishSchema<any>
	| OptionalSchema<any>
	| CollectionSchema<any>
	| ReferenceSchema<any>

type PropertyConverter<T extends PresetSupportedSchemas> = (
	schema: T,
	collectDefaultValue: CollectDefaultValue,
) => Partial<EntitySchemaProperty<any, any>>

const propertyConverters: {
	[K in PresetSupportedSchemas["type"]]: PropertyConverter<Extract<PresetSupportedSchemas, { type: K }>>
} = {
	array: (schema) => ({ type: "array", ...findMetaInPipe(schema) }),
	bigint: (schema) => ({ type: "bigint", ...findMetaInPipe(schema) }),
	blob: (schema) => ({ type: "blob", ...findMetaInPipe(schema) }),
	boolean: (schema) => ({ type: Boolean, ...findMetaInPipe(schema) }),
	date: (schema) => ({ type: Date, ...findMetaInPipe(schema) }),
	number: (schema) => ({ type: Number, ...findMetaInPipe(schema) }),
	string: (schema) => ({ type: String, ...findMetaInPipe(schema) }),
	picklist: (schema) => ({ type: String }),
	enum: (schema) => ({ enum: true, items: () => schema.enum }),
	recursive: (schema) => ({ ...findMetaInPipe(schema.getter()) }),
	nullable: ({ wrapped, default: default_ }, collect) => {
		collect(default_)
		return { ...getProperty(wrapped, collect), nullable: true }
	},
	nullish: ({ wrapped, default: default_ }, collect) => {
		collect(default_)
		return {
			...getProperty(wrapped, collect),
			nullable: true,
		}
	},
	optional: ({ wrapped, default: default_ }, collect) => {
		collect(default_)
		return {
			...getProperty(wrapped, collect),
		}
	},
	non_nullable: ({ wrapped }, collect) => ({
		...getProperty(wrapped, collect),
		nullable: false,
	}),
	non_nullish: ({ wrapped }, collect) => ({
		...getProperty(wrapped, collect),
		nullable: false,
	}),
	non_optional: ({ wrapped }, collect) => ({
		...getProperty(wrapped, collect),
	}),
	mikro_collection: (schema) => schema.meta,
	mikro_reference: (schema) => schema.meta,
}

function findMetaInPipe({ pipe }: { pipe?: Pipe<any> | undefined }): EntitySchemaProperty<any, any> | undefined {
	if (pipe == null) return undefined

	const list: EntitySchemaProperty<any, any>[] = []

	for (const action of pipe) {
		if ((action as any).type === "mikro_property") {
			list.push((action as any).meta)
		}
	}

	if (list.length === 0) return undefined
	let result: EntitySchemaProperty<any, any> = {} as any
	for (const property of list) {
		result = { ...result, ...property }
	}
	return result
}

function onCreateByDefault(default_: any) {
	if (default_ === undefined) return undefined
	return () => {
		if (typeof default_ === "function") return default_()
		return default_
	}
}
