import { describe, expect, it } from "vitest"
import { object, string, optional, merge } from "valibot"
import { InferEntity, property, toEntitySchema, withRelations } from "../src"
import { nanoid } from "nanoid"
import { manyToOne } from "../src/schema/reference"
import { oneToMany } from "../src/schema/collection"
import { Collection, EntitySchema, MikroORM, Ref } from "@mikro-orm/better-sqlite"

describe("simple reference", () => {
	const BreederSchema = object({
		id: optional(string([property({ primary: true })]), () => nanoid()),
		name: string(),
	})

	const GiraffeSchema = object({
		id: optional(string([property({ primary: true })]), () => nanoid()),
		name: string(),
		breeder: manyToOne(() => BreederSchema),
	})

	const Breeder = toEntitySchema("Breeder", BreederSchema)
	const Giraffe = toEntitySchema("Giraffe", GiraffeSchema)

	it("should refer correctly ", async () => {
		const orm = await MikroORM.init({
			entities: [Breeder, Giraffe],
			dbName: ":memory:",
		})
		await orm.schema.updateSchema()
		const em1 = orm.em.fork()
		const breeder = em1.create(Breeder, { name: "breeder" })
		const giraffe = em1.create(Giraffe, { name: "giraffe", breeder })
		await em1.flush()

		const em2 = orm.em.fork()
		const giraffe2 = await em2.findOneOrFail(Giraffe, giraffe.id)
		const breeder2 = await giraffe2.breeder.load()
		expect(breeder2?.id).toEqual(breeder.id)
		expect(breeder2).toBeDefined()
	})
})

describe("circular reference", () => {
	const BreederLonelySchema = object({
		id: optional(string([property({ primary: true })]), () => nanoid()),
		name: string(),
	})

	const BreederSchema = merge([
		BreederLonelySchema,
		object({
			giraffes: oneToMany(() => GiraffeSchema, { mappedBy: "breeder" }),
		}),
	])

	const GiraffeLonelySchema = object({
		id: optional(string([property({ primary: true })]), () => nanoid()),
		name: string(),
	})

	const GiraffeSchema = merge([
		GiraffeLonelySchema,
		object({
			breeder: manyToOne(() => BreederSchema),
		}),
	])

	const Breeder: EntitySchema<IBreeder> = toEntitySchema("Breeder", BreederSchema)
	const Giraffe: EntitySchema<IGiraffe> = toEntitySchema("Giraffe", GiraffeSchema)

	interface IBreeder extends InferEntity<typeof BreederLonelySchema> {
		giraffes: Collection<IGiraffe>
	}
	interface IGiraffe extends InferEntity<typeof GiraffeLonelySchema> {
		breeder: Ref<IBreeder>
	}

	it("should refer correctly ", async () => {
		const orm = await MikroORM.init({
			entities: [Breeder, Giraffe],
			dbName: ":memory:",
		})
		await orm.schema.updateSchema()
		const em1 = orm.em.fork()
		const breeder = em1.create(Breeder, { name: "breeder" })
		const giraffe = em1.create(Giraffe, { name: "giraffe", breeder })
		await em1.flush()

		const em2 = orm.em.fork()
		const giraffe2 = await em2.findOneOrFail(Giraffe, giraffe.id)
		const breeder2 = await giraffe2.breeder.load()
		expect(breeder2).toBeDefined()
		expect(breeder2?.id).toEqual(breeder.id)

		const em3 = orm.em.fork()
		const breeder3 = await em3.findOneOrFail(Breeder, breeder.id)
		const giraffes3 = await breeder3.giraffes.load()

		expect(giraffes3.length).toEqual(1)
		expect(giraffes3[0].id).toEqual(giraffe.id)
	})
})

describe("circular reference withRelations", () => {
	const BreederSchema = object({
		id: optional(string([property({ primary: true })]), () => nanoid()),
		name: string(),
		giraffes: oneToMany(() => Giraffe, { mappedBy: "breeder" }),
	})

	const Breeder = toEntitySchema("Breeder", BreederSchema)

	const GiraffeSchema = object({
		id: optional(string([property({ primary: true })]), () => nanoid()),
		name: string(),
	})

	interface IGiraffe extends InferEntity<typeof GiraffeSchema> {
		breeder: Ref<InferEntity<typeof Breeder>>
	}
	const Giraffe: EntitySchema<IGiraffe> = toEntitySchema(
		"Giraffe",
		withRelations<IGiraffe>(GiraffeSchema, {
			breeder: manyToOne(() => Breeder),
		}),
	)

	it("should refer correctly ", async () => {
		const orm = await MikroORM.init({
			entities: [Breeder, Giraffe],
			dbName: ":memory:",
		})
		await orm.schema.updateSchema()
		const em1 = orm.em.fork()
		const breeder = em1.create(Breeder, { name: "breeder" })
		const giraffe = em1.create(Giraffe, { name: "giraffe", breeder })
		await em1.flush()

		const em2 = orm.em.fork()
		const giraffe2 = await em2.findOneOrFail(Giraffe, giraffe.id)
		const breeder2 = await giraffe2.breeder.load()
		expect(breeder2).toBeDefined()
		expect(breeder2?.id).toEqual(breeder.id)

		const em3 = orm.em.fork()
		const breeder3 = await em3.findOneOrFail(Breeder, breeder.id)
		const giraffes3 = await breeder3.giraffes.load()

		expect(giraffes3.length).toEqual(1)
		expect(giraffes3[0].id).toEqual(giraffe.id)
	})
})
