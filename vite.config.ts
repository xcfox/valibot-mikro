import swc from "@rollup/plugin-swc"
import { defineConfig } from "vite"

export default defineConfig({
	plugins: [
		swc({
			swc: {
				jsc: {
					parser: {
						syntax: "typescript",
						dynamicImport: true,
						decorators: true,
					},
					target: "esnext",
					transform: {
						decoratorMetadata: true,
					},
				},
			},
		}),
	],
	esbuild: false,
})
