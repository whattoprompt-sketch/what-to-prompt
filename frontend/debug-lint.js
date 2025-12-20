import { loadESLint } from 'eslint';
import { writeFile } from 'fs/promises';

async function runLint() {
    try {
        const ESLint = await loadESLint({ useFlatConfig: true });
        const eslint = new ESLint();
        const results = await eslint.lintFiles(['src/pages/Index.tsx', 'src/pages/Result.tsx']);

        const formatter = await eslint.loadFormatter('stylish');
        const resultText = await formatter.format(results);

        console.log(resultText);

        // Also save json for me to read easily
        const jsonFormatter = await eslint.loadFormatter('json');
        const jsonResult = await jsonFormatter.format(results);
        await writeFile('lint-results.json', jsonResult);
    } catch (err) {
        console.error('Error running eslint:', err);
    }
}

runLint();
