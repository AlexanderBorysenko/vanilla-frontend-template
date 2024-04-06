import { BuildOptions, PluginOption, defineConfig } from 'vite';
import sassGlobImports from 'vite-plugin-sass-glob-import';
import htmlPreprocessorPlugin from './vite-plugins/htmlComponentsPreprocessor';
import { resolve } from 'path';

export default defineConfig(() => {
	const plugins: PluginOption[] | undefined = [
		htmlPreprocessorPlugin(),
		sassGlobImports()
	];

	const build: BuildOptions = {
		rollupOptions: {
			input: {
				index: resolve(__dirname, 'index.html'),
			}
		}
	};

	return {
		plugins,
		build
	};
});
