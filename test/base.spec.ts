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
import { defineEntitySchema, property } from "../src"

describe("base schema", () => {
	const GiraffeSchema = object({
		id: string([property({ primary: true })]),
		name: string(),
		birthday: date(),
		height: number(),
		isMale: boolean(),
		favoriteFoods: array(string()),
	})
	const Giraffe = defineEntitySchema("Giraffe0", GiraffeSchema)

	it("should support base property", () => {
		expect(Giraffe.meta.properties.id.primary).toBe(true)
		expect(Giraffe.meta.properties.name.type).toBe("string")
		expect(Giraffe.meta.properties.birthday.type).toBe("date")
		expect(Giraffe.meta.properties.height.type).toBe("number")
		expect(Giraffe.meta.properties.isMale.type).toBe("boolean")
		expect(Giraffe.meta.properties.favoriteFoods.type).toBe("array")
	})
})

describe("optional and nullable schema", () => {
	const TestSchema = object({
		id: string([property({ primary: true })]),
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
	const TestSchema = object({
		id: optional(string([property({ primary: true })]), () => nanoid()),
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
	const TestEntity = defineEntitySchema("Test02", TestSchema)

	it("should support optional property with default value", () => {
		expect(TestEntity.meta.properties.field.default).toBe(undefined)
		expect(TestEntity.meta.properties.optionalField.onCreate).toBeUndefined()
		expect(TestEntity.meta.properties.nullishField.onCreate).toBeUndefined()
		expect(TestEntity.meta.properties.nullableField.onCreate).toBeUndefined()
		expect(TestEntity.meta.properties.optionalFieldWithDefault.onCreate).toBeDefined()
		expect(TestEntity.meta.properties.nullishFieldWithDefault.onCreate).toBeDefined()
		expect(TestEntity.meta.properties.nullableFieldWithDefault.onCreate).toBeDefined()
		expect(TestEntity.meta.properties.optionalFieldWithDefaultCallback.onCreate).toBeDefined()
		expect(TestEntity.meta.properties.nullishFieldWithDefaultCallback.onCreate).toBeDefined()
		expect(TestEntity.meta.properties.nullableFieldWithDefaultCallback.onCreate).toBeDefined()
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
