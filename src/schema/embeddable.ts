import type { EntitySchemaProperty } from "@mikro-orm/core"
import type { BaseSchema, Input, ObjectSchema, Output, Pipe } from "valibot"
import { schemaEntityNameMap } from "../utils/schemaEntityNameMap"

/**
 * Mikro Embeddable schema type.
 */
export type MikroEmbeddableSchema<
	Owner = any,
	TGetter extends () => ObjectSchema<any> = () => any,
	TOutput = Output<ReturnType<TGetter>>,
> = BaseSchema<Input<ReturnType<TGetter>>, TOutput> & {
	/**
	 * The schema type.
	 */
	type: "mikro_embeddable"
	/**
	 * The schema getter.
	 */
	getter: TGetter

	/**
	 * The metadata for property.
	 */
	meta: Extract<EntitySchemaProperty<TOutput, Owner>, { kind: "embedded" }>
}

/**
 * Creates a Mikro Embeddable schema.
 *
 * @param getter The schema getter.
 *
 * @param meta The metadata for property.
 *
 * @returns A Mikro Embeddable schema.
 */
export function embeddable<Owner = any, TGetter extends () => ObjectSchema<any> = () => any>(
	getter: TGetter,
	meta?: Partial<Extract<EntitySchemaProperty<Output<ReturnType<TGetter>>, Owner>, { kind: "embedded" }>>,
): MikroEmbeddableSchema<Owner, TGetter> {
	return {
		type: "mikro_embeddable",
		async: false,
		meta: {
			kind: "embedded",
			entity: () => {
				const name = schemaEntityNameMap.get(getter())
				if (name == null) throw new Error("🚫 schema must be named.")
				return name as any
			},
			...meta,
		},
		getter,
		_parse(input, info) {
			return this.getter()._parse(input, info)
		},
	}
}
