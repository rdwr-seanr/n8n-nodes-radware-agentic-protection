import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');

test('package exposes only the supported in-path n8n surfaces', () => {
	assert.deepEqual(packageJson.n8n.credentials, [
		'dist/credentials/RadwareInPathApi.credentials.js',
	]);
	assert.deepEqual(packageJson.n8n.nodes, [
		'dist/nodes/RadwareChatModel/RadwareChatModel.node.js',
	]);
});

test('customer README does not advertise an out-of-path node', () => {
	assert.match(readme, /Radware Chat Model/);
	assert.doesNotMatch(readme, /Radware Agentic Guard/);
	assert.doesNotMatch(readme, /Radware Out-of-Path API/);
});
