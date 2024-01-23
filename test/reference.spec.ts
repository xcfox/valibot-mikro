import { describe } from "vitest"
import { object, string, optional, merge, BaseSchema } from "valibot"
import { InferEntity, PickRelations, property, toEntitySchema, withRelations } from "../src"
import { nanoid } from "nanoid"
import { manyToOne } from "../src/schema/reference"
import { oneToMany } from "../src/schema/collection"
import { Collection, EntitySchema, MikroORM, Ref } from "@mikro-orm/core"
import { it } from "node:test"

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

	type IBreeder = InferEntity<typeof Breeder>
	type IGiraffe = InferEntity<typeof Giraffe>
})

describe("circular reference usage 1", () => {
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
		const em = orm.em.fork()
		const breeder = em.create(Breeder, { name: "breeder" })
		const giraffe = em.create(Giraffe, { name: "giraffe", breeder })
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
		const em = orm.em.fork()
		const breeder = em.create(Breeder, { name: "breeder" })
		const giraffe = em.create(Giraffe, { name: "giraffe", breeder })
		breeder.giraffes
		giraffe.breeder
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

	const Giraffe: EntitySchema<IGiraffe> = toEntitySchema(
		"Giraffe",
		withRelations<IGiraffe>(GiraffeSchema, {
			breeder: manyToOne(() => Breeder),
		}),
	)
	type IGiraffe = InferEntity<typeof GiraffeSchema> & { breeder: Ref<InferEntity<typeof Breeder>> }

	it("should refer correctly ", async () => {
		const orm = await MikroORM.init({
			entities: [Breeder, Giraffe],
			dbName: ":memory:",
		})
		await orm.schema.updateSchema()
		const em = orm.em.fork()
		const breeder = em.create(Breeder, { name: "breeder" })
		const giraffe = em.create(Giraffe, { name: "giraffe", breeder })
		breeder.giraffes
		giraffe.breeder
	})
})
