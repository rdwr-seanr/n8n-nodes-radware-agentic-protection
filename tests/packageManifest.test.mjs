import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');

test('package uses the official Radware npm scope', () => {
	assert.equal(packageJson.name, '@radware/n8n-nodes-radware-agentic-protection');
	assert.equal(packageJson.publishConfig?.access, 'public');
	assert.match(packageJson.author.email, /@radware\.com$/);
	assert.match(packageJson.repository.url, /github\.com\/Radware\//);
	assert.match(readme, /@radware\/n8n-nodes-radware-agentic-protection/);
});

test('package exposes only the supported in-path n8n surfaces', () => {
	assert.deepEqual(packageJson.n8n.credentials, [
		'dist/credentials/RadwareInPathApi.credentials.js',
	]);
	assert.deepEqual(packageJson.n8n.nodes, [
		'dist/nodes/RadwareChatModel/RadwareChatModel.node.js',
	]);
});

test('package declares the n8n AI SDK using the supported peer dependency name', () => {
	assert.deepEqual(packageJson.peerDependencies, {
		'@n8n/ai-node-sdk': '*',
		'n8n-workflow': '*',
	});
	assert.equal(packageJson.peerDependenciesMeta, undefined);
});

test('customer README does not advertise an out-of-path node', () => {
	assert.match(readme, /Radware Chat Model/);
	assert.doesNotMatch(readme, /Radware Agentic Guard/);
	assert.doesNotMatch(readme, /Radware Out-of-Path API/);
});
