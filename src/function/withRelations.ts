import { ObjectSchema, Output, BaseSchema, merge, object } from "valibot"
import type { Ref, Collection, OptionalProps, EntitySchema, EntityMetadata } from "@mikro-orm/core"
import { ReferenceSchema } from "../schema/reference"
import { CollectionSchema } from "../schema/collection"
import { BASE_REF } from "../utils/baseRef"

export function withRelations<TFinal extends EntityEntries>(
	base: LooseObjectSchema<ToLooseObjectEntries<OmitRelations<TFinal>>>,
	entries: PickRelations<TFinal>,
): ObjectSchema<any, any, TFinal> {
	const result = merge([base as any, object(entries)]) as any
	result[BASE_REF] = base
	return result
}

// return
// ObjectSchema<ToObjectEntries<TFinal>>

type LooseBaseSchema<TOutput = any> = {
	_types?: {
		output: TOutput
	}
}

/**
 * Object entries type.
 */
type LooseObjectEntries = Record<string, LooseBaseSchema>

type LooseObjectSchema<TEntries extends LooseObjectEntries> = {
	type: "object"
	entries: TEntries
}

type ToLooseObjectEntries<T extends EntityEntries> = {
	[K in keyof T]: LooseBaseSchema<T[K]>
}

type EntityEntries = Record<string, any>

type OmitRelations<T extends Record<string, any>> = Omit<
	T,
	typeof OptionalProps | PickRefKeys<T> | PickCollectionKeys<T>
>

type PickRefKeys<TEntries extends EntityEntries> = {
	[K in keyof TEntries]: TEntries[K] extends Ref<any> ? K : never
}[keyof TEntries]

type PickCollectionKeys<TEntries extends EntityEntries> = {
	[K in keyof TEntries]: TEntries[K] extends Collection<any> ? K : never
}[keyof TEntries]

export type PickRelations<TEntries extends EntityEntries> = {
	[K in PickRefKeys<TEntries> | PickCollectionKeys<TEntries>]: TEntries[K] extends Ref<infer R>
		? ReferenceSchema<EntitySchema<R, any>>
		: TEntries[K] extends Collection<infer C>
		  ? CollectionSchema<EntitySchema<C, any>>
		  : never
}
