import { MikroORM } from "@mikro-orm/better-sqlite"
import { nanoid } from "nanoid"
import {
	array,
	boolean,
	date,
	nonNullable,
	nonNullish,
	nonOptional,
	nullable,
	nullish,
	number,
	object,
	optional,
	string,
} from "valibot"
import { describe, expect, it } from "vitest"
import { defineEntitySchema, primaryKey } from "../src"

describe("base schema", () => {
	const Giraffe = defineEntitySchema("Giraffe0", {
		id: string([primaryKey()]),
		name: string(),
		birthday: date(),
		height: number(),
		isMale: boolean(),
		favoriteFoods: array(string()),
	})

	it("should support base property", () => {
		expect(Giraffe.meta.properties.id.primary).toBe(true)
		expect(Giraffe.meta.properties.name.type).toBe(String)
		expect(Giraffe.meta.properties.birthday.type).toBe(Date)
		expect(Giraffe.meta.properties.height.type).toBe(Number)
		expect(Giraffe.meta.properties.isMale.type).toBe(Boolean)
		expect(Giraffe.meta.properties.favoriteFoods.type).toBe("array")
	})
})

describe("optional and nullable schema", () => {
	const TestSchema = object({
		id: string([primaryKey()]),
		field: string(),
		optionalField: optional(string()),
		nullishField: nullish(string()),
		nullableField: nullable(string()),
		nonNullableField: nonNullable(string()),
		nonNullishField: nonNullish(string()),
		nonOptionalField: nonOptional(string()),
	})
	const TestEntity = defineEntitySchema("Test01", TestSchema)

	it("should support optional property", () => {
		expect(TestEntity.meta.properties.field.nullable).toBe(undefined)
		expect(TestEntity.meta.properties.optionalField.nullable).toBe(undefined)
		expect(TestEntity.meta.properties.nullishField.nullable).toBe(true)
		expect(TestEntity.meta.properties.nullableField.nullable).toBe(true)
		expect(TestEntity.meta.properties.nonNullableField.nullable).toBe(false)
		expect(TestEntity.meta.properties.nonNullishField.nullable).toBe(false)
		expect(TestEntity.meta.properties.nonOptionalField.nullable).toBe(undefined)
	})
})

describe("field with default value", () => {
	const TestEntity = defineEntitySchema("Test02", {
		id: optional(string([primaryKey()]), () => nanoid()),
		field: string(),
		optionalField: optional(string()),
		optionalFieldWithDefault: optional(string([]), "hello"),
		optionalFieldWithDefaultCallback: optional(string([]), () => "hello"),
		nullishField: nullish(string()),
		nullishFieldWithDefault: nullish(string([]), "hello"),
		nullishFieldWithDefaultCallback: nullish(string([]), () => "hello"),
		nullableField: nullable(string()),
		nullableFieldWithDefault: nullable(string([]), "hello"),
		nullableFieldWithDefaultCallback: nullable(string([]), () => "hello"),
	})

	it("should support optional property with default value", async () => {
		const orm = await MikroORM.init({
			entities: [TestEntity],
			dbName: ":memory:",
		})
		await orm.schema.updateSchema()
		const em = orm.em.fork()
		const test = em.create(TestEntity, { field: "hello" })

		expect(test.field).toBe("hello")
		expect(test.optionalField).toBe(undefined)
		expect(test.optionalFieldWithDefault).toBe("hello")
		expect(test.optionalFieldWithDefaultCallback).toBe("hello")
		expect(test.nullishField).toBe(undefined)
		expect(test.nullishFieldWithDefault).toBe("hello")
		expect(test.nullishFieldWithDefaultCallback).toBe("hello")
		expect(test.nullableField).toBe(undefined)
		expect(test.nullableFieldWithDefault).toBe("hello")
		expect(test.nullableFieldWithDefaultCallback).toBe("hello")
	})

	it("should support omitting default value", async () => {
		const orm = await MikroORM.init({
			entities: [TestEntity],
			dbName: ":memory:",
		})
		await orm.schema.updateSchema()
		const em = orm.em.fork()
		const test = em.create(TestEntity, { field: "hello", optionalField: "hello" })

		expect(test.optionalField).toBe("hello")
		expect(test.nullishField).toBe(undefined)
		expect(test.nullableField).toBe(undefined)

		await em.flush()

		expect(test.optionalFieldWithDefault).toBe("hello")
		expect(test.nullishFieldWithDefault).toBe("hello")
		expect(test.nullableFieldWithDefault).toBe("hello")
		expect(test.optionalFieldWithDefaultCallback).toBe("hello")
		expect(test.nullishFieldWithDefaultCallback).toBe("hello")
		expect(test.nullableFieldWithDefaultCallback).toBe("hello")
	})
})
