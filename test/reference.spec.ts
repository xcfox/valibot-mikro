import { Collection, EntitySchema, MikroORM, Ref } from "@mikro-orm/better-sqlite"
import { nanoid } from "nanoid"
import { merge, object, optional, string } from "valibot"
import { describe, expect, it } from "vitest"
import { InferEntity, defineEntitySchema, primaryKey, property, withRelations } from "../src"
import { oneToMany } from "../src/schema/collection"
import { manyToOne } from "../src/schema/reference"

describe("simple reference", () => {
	const Breeder = defineEntitySchema("Breeder", {
		id: optional(string([primaryKey()]), () => nanoid()),
		name: string(),
	})

	const Giraffe = defineEntitySchema("Giraffe", {
		id: optional(string([primaryKey()]), () => nanoid()),
		name: string(),
		breeder: manyToOne(() => Breeder),
	})

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

	const Breeder: EntitySchema<IBreeder> = defineEntitySchema("Breeder", BreederSchema)
	const Giraffe: EntitySchema<IGiraffe> = defineEntitySchema("Giraffe", GiraffeSchema)

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
	const Breeder = defineEntitySchema(
		"Breeder",
		object({
			id: optional(string([property({ primary: true })]), () => nanoid()),
			name: string(),
			giraffes: oneToMany(() => Giraffe, { mappedBy: "breeder" }),
		}),
	)

	const GiraffeSchema = object({
		id: optional(string([property({ primary: true })]), () => nanoid()),
		name: string(),
	})

	interface IGiraffe extends InferEntity<typeof GiraffeSchema> {
		breeder: Ref<InferEntity<typeof Breeder>>
	}
	const Giraffe: EntitySchema<IGiraffe> = defineEntitySchema(
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
