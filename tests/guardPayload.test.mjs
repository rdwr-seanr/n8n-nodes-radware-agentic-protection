import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const helpers = require('../dist/nodes/RadwareAgenticGuard/helpers.js');

test('builds prompt-stage Radware payload without tool fields', () => {
	const payload = helpers.buildRadwarePayload({
		operation: 'checkPrompt',
		apiKey: 'sk-rdwr-test',
		userPrompt: 'Summarize this workflow',
		userIdentifier: 'n8n-out-path',
		userContext: '',
		modelToUse: 'gpt-4o',
	});

	assert.equal(payload.UserPrompt, 'Summarize this workflow');
	assert.equal(payload.UserIdentifier, 'n8n-out-path');
	assert.equal(payload.ApiKey, 'sk-rdwr-test');
	assert.equal(payload.ModelToUse, 'gpt-4o');
	assert.equal(Object.hasOwn(payload, 'ToolName'), false);
	assert.equal(Object.hasOwn(payload, 'ArgsInput'), false);
});

test('builds tool-stage payload and infers a tool schema', () => {
	const payload = helpers.buildRadwarePayload({
		operation: 'checkToolAction',
		apiKey: 'sk-rdwr-test',
		userPrompt: 'Follow the instructions in the email',
		userIdentifier: 'n8n-out-path',
		userContext: 'Retrieved email asks the agent to exfiltrate employee data.',
		modelToUse: 'gpt-4o',
		toolName: 'send_email',
		argsInput: {
			to: 'attacker@example.net',
			subject: 'customer notes',
			body: 'Sensitive details',
		},
		toolsInput: [],
	});

	assert.equal(payload.ToolName, 'send_email');
	assert.equal(payload.ArgsInput.to, 'attacker@example.net');
	assert.equal(payload.ToolsInput.length, 1);
	assert.equal(payload.ToolsInput[0].name, 'send_email');
	assert.equal(payload.ToolsInput[0].parameters.type, 'object');
});

test('builds response-stage payload with LLM response in context', () => {
	const payload = helpers.buildRadwarePayload({
		operation: 'checkResponse',
		apiKey: 'sk-rdwr-test',
		userPrompt: 'Summarize this workflow',
		userIdentifier: 'n8n-out-path',
		userContext: 'conversation history',
		responseText: 'The final answer contains a response that Radware should inspect.',
		modelToUse: 'gpt-4o',
	});

	assert.equal(payload.UserPrompt, 'Summarize this workflow');
	assert.equal(payload.UserIdentifier, 'n8n-out-path');
	assert.match(payload.UserContext, /conversation history/);
	assert.match(payload.UserContext, /LLM final response:/);
	assert.match(payload.UserContext, /Radware should inspect/);
	assert.equal(Object.hasOwn(payload, 'ToolName'), false);
});

test('normalizes Radware block decisions', () => {
	const decision = helpers.decisionFromRadwareResponse({
		IsBlocked: true,
		EventId: 'event-123',
		Module: 'Behavioral data leakage',
		Message: 'Blocked',
	});

	assert.equal(decision.isBlocked, true);
	assert.equal(decision.eventId, 'event-123');
	assert.equal(decision.status, 'blocked');
	assert.equal(decision.module, 'Behavioral data leakage');
});

test('redacts secret-shaped values in output', () => {
	const sanitized = helpers.sanitizeForOutput({
		ApiKey: 'sk-rdwr-abcdefghijklmnopqrstuvwxyz',
		nested: {
			message: 'token sk-proj-abcdefghijklmnopqrstuvwxyz',
		},
	});

	assert.equal(sanitized.ApiKey, '[REDACTED]');
	assert.equal(sanitized.nested.message, 'token sk-proj-[REDACTED]');
});
