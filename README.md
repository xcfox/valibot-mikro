# Valibot-Mikro

Defining [MikroORM](https://mikro-orm.io/) [entities](https://mikro-orm.io/docs/defining-entities) with [Valibot](https://valibot.dev/)!

```TypeScript
const User = defineEntitySchema(
	"User",
	object({
		id: number([property({ primary: true })]),
		name: string(),
		address: oneToOne(() => Address),
		cars: manyToMany(() => Car),
	}),
)
```

## Highlights

- 💪 Fully type safe with static type inference
- 🔮 No need for `ts-morph` magic or experimental `decorators`
- 🧩 Compositing entities rather than Inheriting
- 📦 Simple and easy-to-use API

## Install
It is assumed that you have already installed MikroORM, if not, please read the MikroORM [installation documentation](https://mikro-orm.io/docs/quick-start) first.
```bash
## use npm
npm install valibot valibot-mikro

## use yarn
yarn add valibot valibot-mikro

## use pnpm
pnpm add valibot valibot-mikro
```

## Usage

`Valibot-Mikro` is a utils library for [EntitySchema](https://mikro-orm.io/docs/entity-schema) of MikroORM. It helps you to define your entities via `EntitySchema` in a type-safe way.

### Basic Usage

Here we define a `User` entity with `Valibot` and `Valibot-Mikro`:

```TypeScript
import { object, string, optional } from "valibot"
import { defineEntitySchema, property, InferEntity } from "valibot-mikro"

export const User = defineEntitySchema(
	"User",
	object({
		id: number([property({ primary: true })]),
		fullName: string(),
		email: string(),
		password: string(),
		bio: optional(string(),''),
	}),
)
```

We need to use `em.create()` method to create a new instance of the entity:

```TypeScript
const author = em.create(User, { fullName: 'name', email: 'email', password:'secret' });
await em.flush();
```

### Composable entities
Thanks to `valibot`, we can easily combine various entities: 
```TypeScript
import { object, string, optional, nullable, date, merge, number } from "valibot"
import { property, defineEntitySchema } from "valibot-mikro"

const BaseEntity = object({
	id: number([property({ primary: true })]),
	createdAt: date(),
	updatedAt: date([property({ onUpdate: () => new Date() })]),
})

const CanSale = object({
	prices: number([property({ columnType: "money" })]),
	inventory: number([property({ columnType: "int" })]),
})

export const Book = defineEntitySchema(
	"Book",
	merge([
		BaseEntity,
		CanSale,
		object({
			title: string(),
			author: string(),
		}),
	]),
)

export const Flower = defineEntitySchema(
	"Flower",
	merge([
		BaseEntity,
		CanSale,
		object({
			variety: string(),
			color: nullable(string()),
		}),
	]),
)
```

### Add more metadata 

The `defineEntitySchema` method can take same options as `EntitySchema` constructor. For example, we can add `tableName` to the `User` entity:

```TypeScript
import { object, string, number } from "valibot"
import { defineEntitySchema, property } from "valibot-mikro"

export const User = defineEntitySchema(
	{ name: "User", tableName: "user_table", indexes: [{ properties: ["email"] }] },
	object({
		id: number([property({ primary: true })]),
		fullName: string(),
		email: string(),
		password: string(),
	}),
)
```
### Modeling Entity Relationships
Let's see how easy it is to define relationships: 

```TypeScript
import { object, string, number } from "valibot"
import { defineEntitySchema, property, manyToOne } from "valibot-mikro"

const Breeder = defineEntitySchema(
	"Breeder",
	object({
		id: number([property({ primary: true })]),
		name: string(),
	}),
)

const Giraffe = defineEntitySchema(
	"Giraffe",
	object({
		id: number([property({ primary: true })]),
		name: string(),
		breeder: manyToOne(() => Breeder),
	}),
)
```
Defining relationships using `valibot-mikro` is similar to traditional method types. 
Here we have 6 methods to define relationships, four of which are the same as the traditional methods: 
- `oneToOne`
- `manyToOne`
- `oneToMany`
- `manyToMany`

and two methods that allow you to define relationships manually:
- `collection`: define a [collection](https://mikro-orm.io/docs/collections)
- `reference`: define a [reference](https://mikro-orm.io/docs/type-safe-relations#reference-wrapper)

#### Circular Reference
TypeScript is generally able to derive types correctly for us, however, when it comes to circular references, TypeScript can't help.  
So when we encounter circular references, we need to give TypeScript a hand by telling it the correct type:

```TypeScript
import { object, string, number } from "valibot"
import { EntitySchema } from "@mikro/core"
import { defineEntitySchema, property, manyToOne, withRelations, InferEntity } from "valibot-mikro"

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
```
In this example there are circular references to `Breeder` and `Giraffe`, and TypeScript can't infer their types correctly for us, so we need to manually declare the type of one of them and tell TypeScript that type.  
In this example we declare `Giraffe`'s type as `IGiraffe` and mark the `Giraffe` as `EntitySchema<IGiraffe>`. In addition, we use the `withRelations` function to minimize boilerplate code.


### Optional or Nullable Properties
#### Default values
### Enums
Oops, it is not implemented yet