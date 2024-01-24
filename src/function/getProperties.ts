import { EntitySchemaMetadata, EntitySchemaProperty } from "@mikro-orm/core"
import {
	ArraySchema,
	BaseSchema,
	BigintSchema,
	BlobSchema,
	BooleanSchema,
	DateSchema,
	NonNullableSchema,
	NonNullishSchema,
	NonOptionalSchema,
	NullableSchema,
	NullishSchema,
	NumberSchema,
	ObjectSchema,
	OptionalSchema,
	Pipe,
	StringSchema,
} from "valibot"
import { CollectionSchema } from "../schema/collection"
import { ReferenceSchema } from "../schema/reference"

export function getProperties(schema: ObjectSchema<any>): EntitySchemaMetadata<any, any>["properties"] {
	const properties = {} as any
	Object.entries(schema.entries).map(([key, valueSchema]) => {
		const property = getProperty(valueSchema as any)
		if (property) properties[key] = property
	})
	return properties as EntitySchemaMetadata<any, any>["properties"]
}

function getProperty(schema: BaseSchema): Partial<EntitySchemaProperty<any, any>> | undefined {
	if (typeof schema !== "object") return undefined
	if (!("type" in schema)) return undefined
	const converter: PropertyConverter<any> | undefined = (propertyConverters as any)[schema.type as any]
	if (converter) return converter(schema)
	const property = findMetaInPipe(schema as any)
	if (property) return property
}

export type PresetSupportedSchemas =
	| ArraySchema<any>
	| BigintSchema
	| BlobSchema
	| BooleanSchema
	| DateSchema
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

type PropertyConverter<T extends PresetSupportedSchemas> = (schema: T) => Partial<EntitySchemaProperty<any, any>>

const propertyConverters: {
	[K in PresetSupportedSchemas["type"]]: PropertyConverter<Extract<PresetSupportedSchemas, { type: K }>>
} = {
	array: (schema) => ({ type: "array", ...findMetaInPipe(schema) }),
	bigint: (schema) => ({ type: "bigint", ...findMetaInPipe(schema) }),
	blob: (schema) => ({ type: "blob", ...findMetaInPipe(schema) }),
	boolean: (schema) => ({ type: "boolean", ...findMetaInPipe(schema) }),
	date: (schema) => ({ type: "date", ...findMetaInPipe(schema) }),
	number: (schema) => ({ type: "number", ...findMetaInPipe(schema) }),
	string: (schema) => ({ type: "string", ...findMetaInPipe(schema) }),
	nullable: ({ wrapped, default: default_ }) => ({
		...getProperty(wrapped),
		nullable: true,
		onCreate: onCreateByDefault(default_),
	}),
	nullish: ({ wrapped, default: default_ }) => ({
		...getProperty(wrapped),
		nullable: true,
		onCreate: onCreateByDefault(default_),
	}),
	optional: ({ wrapped, default: default_ }) => ({
		...getProperty(wrapped),
		onCreate: onCreateByDefault(default_),
	}),
	non_nullable: ({ wrapped }) => ({
		...getProperty(wrapped),
		nullable: false,
	}),
	non_nullish: ({ wrapped }) => ({
		...getProperty(wrapped),
		nullable: false,
	}),
	non_optional: ({ wrapped }) => ({
		...getProperty(wrapped),
	}),
	mikro_collection: (schema) => schema.meta,
	mikro_reference: (schema) => schema.meta,
}

function findMetaInPipe({ pipe }: { pipe?: Pipe<any> | undefined }): EntitySchemaProperty<any, any> | undefined {
	if (pipe == null) return undefined
	for (const action of pipe) {
		if ((action as any).type === "mikro-property") {
			return (action as any).meta as EntitySchemaProperty<any, any>
		}
	}
}

function onCreateByDefault(default_: any) {
	if (default_ === undefined) return undefined
	return () => {
		if (typeof default_ === "function") return default_()
		return default_
	}
}
