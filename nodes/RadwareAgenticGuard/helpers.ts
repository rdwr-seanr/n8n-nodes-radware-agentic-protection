export type FailMode = 'fail-close' | 'fail-open';

export type GuardOperation = 'checkPrompt' | 'checkResponse' | 'checkToolAction';

export type ToolInput = {
	type: 'function';
	name: string;
	description: string;
	parameters: Record<string, unknown>;
};

export type RadwarePayload = {
	UserPrompt: string;
	UserIdentifier: string;
	ApiKey: string;
	ModelToUse: string;
	UserContext?: string;
	ToolName?: string;
	ArgsInput?: Record<string, unknown>;
	ToolsInput?: ToolInput[];
};

export type GuardBuildInput = {
	operation: GuardOperation;
	apiKey: string;
	userPrompt: string;
	userIdentifier: string;
	userContext: string;
	responseText?: string;
	modelToUse: string;
	toolName?: string;
	argsInput?: unknown;
	toolsInput?: unknown;
};

export type GuardDecision = {
	isBlocked: boolean;
	eventId: string;
	status: 'allowed' | 'blocked' | 'unavailable' | 'invalid-response';
	module: string;
	blockReason: string;
};

const API_KEY_RE = /(sk-rdwr-|sk-proj-)[A-Za-z0-9_-]+/g;

export function safeString(value: unknown, fallback = ''): string {
	return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function safeTrimmedString(value: unknown, fallback = ''): string {
	return safeString(value, fallback).trim();
}

export function parseJsonParameter(value: unknown, fallback: unknown): unknown {
	if (value === undefined || value === null || value === '') {
		return fallback;
	}

	if (typeof value !== 'string') {
		return value;
	}

	try {
		return JSON.parse(value);
	} catch {
		return fallback;
	}
}

export function objectFromJson(value: unknown): Record<string, unknown> {
	const parsed = parseJsonParameter(value, {});
	return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
		? (parsed as Record<string, unknown>)
		: {};
}

export function toolsFromJson(value: unknown, fallbackToolName = '', fallbackArgs: Record<string, unknown> = {}): ToolInput[] {
	const parsed = parseJsonParameter(value, []);
	if (Array.isArray(parsed) && parsed.length > 0) {
		return parsed
			.filter((item): item is ToolInput => Boolean(item) && typeof item === 'object')
			.map((item) => normalizeTool(item as Record<string, unknown>))
			.filter((item) => item.name.length > 0);
	}

	if (!fallbackToolName) {
		return [];
	}

	return [
		{
			type: 'function',
			name: fallbackToolName,
			description: `n8n workflow tool action: ${fallbackToolName}`,
			parameters: inferParametersSchema(fallbackArgs),
		},
	];
}

function normalizeTool(item: Record<string, unknown>): ToolInput {
	const functionShape =
		item.function && typeof item.function === 'object'
			? (item.function as Record<string, unknown>)
			: item;

	return {
		type: 'function',
		name: safeString(functionShape.name),
		description: safeString(functionShape.description, `n8n tool action: ${safeString(functionShape.name)}`),
		parameters:
			functionShape.parameters && typeof functionShape.parameters === 'object'
				? (functionShape.parameters as Record<string, unknown>)
				: { type: 'object', additionalProperties: true },
	};
}

function inferJsonSchema(value: unknown): Record<string, unknown> {
	if (value === null) {
		return { type: 'null' };
	}
	if (Array.isArray(value)) {
		return { type: 'array' };
	}
	if (typeof value === 'object') {
		return { type: 'object', additionalProperties: true };
	}
	if (typeof value === 'number') {
		return Number.isInteger(value) ? { type: 'integer' } : { type: 'number' };
	}
	if (typeof value === 'boolean') {
		return { type: 'boolean' };
	}
	return { type: 'string' };
}

export function inferParametersSchema(args: Record<string, unknown>): Record<string, unknown> {
	const properties: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(args)) {
		properties[key] = inferJsonSchema(value);
	}

	return {
		type: 'object',
		properties,
		additionalProperties: true,
	};
}

export function buildRadwarePayload(input: GuardBuildInput): RadwarePayload {
	const userPrompt = safeTrimmedString(input.userPrompt, 'n8n workflow prompt');
	const payload: RadwarePayload = {
		UserPrompt: userPrompt,
		UserIdentifier: safeTrimmedString(input.userIdentifier, 'n8n-user'),
		ApiKey: input.apiKey,
		ModelToUse: safeTrimmedString(input.modelToUse, 'gpt-4o'),
	};

	let userContext = safeTrimmedString(input.userContext);
	const responseText = safeTrimmedString(input.responseText);
	if (input.operation === 'checkResponse' && responseText) {
		userContext = [userContext, `LLM final response:\n${responseText}`].filter(Boolean).join('\n\n');
	}
	if (userContext) {
		payload.UserContext = userContext;
	}

	const argsInput = objectFromJson(input.argsInput);
	const toolName = safeTrimmedString(input.toolName);
	const toolsInput = toolsFromJson(input.toolsInput, toolName, argsInput);

	if (input.operation === 'checkToolAction') {
		payload.ToolName = toolName || 'n8n_tool_action';
		payload.ArgsInput = argsInput;
		payload.ToolsInput = toolsInput;
	} else if (toolsInput.length > 0) {
		payload.ToolsInput = toolsInput;
	}

	return payload;
}

export function decisionFromRadwareResponse(response: unknown): GuardDecision {
	if (!response || typeof response !== 'object') {
		return {
			isBlocked: true,
			eventId: '',
			status: 'invalid-response',
			module: '',
			blockReason: 'Radware returned an invalid response',
		};
	}

	const body = response as Record<string, unknown>;
	const isBlocked = body.IsBlocked === true || body.isBlocked === true;
	const eventId = safeString(body.EventId || body.eventId || body.event_id);
	const module = safeString(body.Module || body.module || body.SecurityModule || body.securityModule);
	const reason = safeString(body.Message || body.message || body.Reason || body.reason);

	return {
		isBlocked,
		eventId,
		status: isBlocked ? 'blocked' : 'allowed',
		module,
		blockReason: reason || (isBlocked ? 'Blocked by Radware Agentic AI Protection' : ''),
	};
}

export function sanitizeForOutput(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(sanitizeForOutput);
	}

	if (value && typeof value === 'object') {
		const output: Record<string, unknown> = {};
		for (const [key, item] of Object.entries(value)) {
			output[key] = /authorization|token|secret|api[-_]?key|password/i.test(key)
				? '[REDACTED]'
				: sanitizeForOutput(item);
		}
		return output;
	}

	if (typeof value === 'string') {
		return value.replace(API_KEY_RE, '$1[REDACTED]');
	}

	return value;
}
