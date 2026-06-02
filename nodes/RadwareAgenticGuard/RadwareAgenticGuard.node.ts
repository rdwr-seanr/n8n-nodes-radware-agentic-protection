import type {
	ICredentialDataDecryptedObject,
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import {
	type FailMode,
	type GuardOperation,
	buildRadwarePayload,
	decisionFromRadwareResponse,
	sanitizeForOutput,
} from './helpers';

type RadwareOutOfPathCredentials = ICredentialDataDecryptedObject & {
	apiKey: string;
	endpoint: string;
};

type BlockHandling = 'error' | 'returnDecision';

function cleanError(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return 'unknown error';
}

export class RadwareAgenticGuard implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Radware Agentic Guard',
		name: 'radwareAgenticGuard',
		icon: { light: 'file:../../icons/radware-mark.svg', dark: 'file:../../icons/radware-mark.dark.svg' },
		group: ['transform'],
		version: [1],
		description: 'Call Radware Agentic AI Protection before LLM prompts or workflow tool actions',
		defaults: {
			name: 'Radware Agentic Guard',
		},
		subtitle: '={{$parameter["operation"]}}',
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'radwareOutOfPathApi',
				required: true,
			},
		],
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Tools'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://github.com/rdwr-seanr/n8n-nodes-radware-agentic-protection/blob/main/docs/out-of-path.md',
					},
					{
						url: 'https://console.radwarecloud.com/',
					},
				],
			},
		},
		properties: [
			{
				displayName:
					'Out-of-path AI Agent pattern: use Check Prompt before the AI Agent, Check Response after the AI Agent, and Check Tool Action at the start of sensitive tool sub-workflows. Create the homegrown agent in <a href="https://console.radwarecloud.com/" target="_blank">Radware Cloud</a>.',
				name: 'outOfPathPlacementNotice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: 'checkPrompt',
				options: [
					{
						name: 'Check Prompt',
						value: 'checkPrompt',
						description: 'Evaluate prompt and context before the LLM interaction',
						action: 'Check a prompt',
					},
					{
						name: 'Check Response',
						value: 'checkResponse',
						description: 'Evaluate the LLM final response before returning it to the user',
						action: 'Check a response',
					},
					{
						name: 'Check Tool Action',
						value: 'checkToolAction',
						description: 'Evaluate a proposed workflow tool action before execution',
						action: 'Check a tool action',
					},
				],
			},
			{
				displayName: 'User Prompt',
				name: 'userPrompt',
				type: 'string',
				default: '={{ $json.chatInput || $json.prompt || $json.text || "" }}',
				required: true,
				description: 'The end-user prompt or workflow request that led to this check',
			},
			{
				displayName: 'User Identifier',
				name: 'userIdentifier',
				type: 'string',
				default: '={{ $json.userId || $json.user || $execution.id }}',
				description: 'Identifier shown as User Name in Radware portal evidence',
			},
			{
				displayName: 'User Context',
				name: 'userContext',
				type: 'string',
				typeOptions: {
					rows: 6,
				},
				default: '={{ JSON.stringify($json.context || $json.history || {}) }}',
				description:
					'Conversation history, retrieved content, prior tool output, or other context needed for Radware analysis',
			},
			{
				displayName: 'LLM Response',
				name: 'responseText',
				type: 'string',
				typeOptions: {
					rows: 6,
				},
				default: '={{ $json.output || $json.response || $json.text || $json.chatOutput || "" }}',
				required: true,
				displayOptions: {
					show: {
						operation: ['checkResponse'],
					},
				},
				description: 'The LLM final response to validate before returning it to the user',
			},
			{
				displayName: 'Model To Use',
				name: 'modelToUse',
				type: 'string',
				default: 'gpt-4o',
				required: true,
				description: 'Model name to include in the Radware explicit API payload',
			},
			{
				displayName: 'Tool Name',
				name: 'toolName',
				type: 'string',
				default: '={{ $json.toolName || "" }}',
				required: true,
				displayOptions: {
					show: {
						operation: ['checkToolAction'],
					},
				},
				description: 'Name of the proposed tool or workflow action',
			},
			{
				displayName: 'Tool Arguments',
				name: 'argsInput',
				type: 'json',
				default: '={{ $json.argsInput || $json.arguments || $json }}',
				displayOptions: {
					show: {
						operation: ['checkToolAction'],
					},
				},
				description: 'Arguments that the workflow action is about to execute',
			},
			{
				displayName: 'Tools Schema',
				name: 'toolsInput',
				type: 'json',
				default: '={{ $json.toolsInput || $json.tools || [] }}',
				description:
					'Optional OpenAI-compatible tool schema list. For Behavioral tool checks, include the relevant tool chain such as read_email plus send_email, not only the final action. If empty for a tool action, the node infers a schema from Tool Arguments.',
			},
			{
				displayName: 'Fail Mode',
				name: 'failMode',
				type: 'options',
				noDataExpression: true,
				default: 'fail-close',
				options: [
					{
						name: 'Fail Close',
						value: 'fail-close',
						description: 'Block or stop the workflow if Radware cannot be reached',
					},
					{
						name: 'Fail Open',
						value: 'fail-open',
						description: 'Allow workflow execution if Radware cannot be reached',
					},
				],
				description: 'Applies only to Radware API unavailability or invalid responses, not Radware policy blocks',
			},
			{
				displayName: 'When Radware Blocks',
				name: 'blockHandling',
				type: 'options',
				noDataExpression: true,
				default: 'error',
				options: [
					{
						name: 'Return Decision',
						value: 'returnDecision',
						description: 'Return the Radware decision so the workflow can branch explicitly',
					},
					{
						name: 'Stop Workflow',
						value: 'error',
						description: 'Throw an error when Radware returns IsBlocked=true',
					},
				],
			},
			{
				displayName: 'Timeout',
				name: 'timeoutMs',
				type: 'number',
				default: 15000,
				typeOptions: {
					minValue: 1000,
					maxValue: 120000,
				},
				description: 'Maximum time in milliseconds to wait for Radware out-of-path enforcement',
			},
			{
				displayName: 'Include Sanitized Radware Response',
				name: 'includeResponse',
				type: 'boolean',
				default: false,
				description: 'Whether to include the sanitized Radware response body in node output',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const output: INodeExecutionData[] = [];
		const credentials = (await this.getCredentials('radwareOutOfPathApi')) as RadwareOutOfPathCredentials;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
			try {
				const operation = this.getNodeParameter('operation', itemIndex) as GuardOperation;
				const failMode = this.getNodeParameter('failMode', itemIndex) as FailMode;
				const blockHandling = this.getNodeParameter('blockHandling', itemIndex) as BlockHandling;
				const includeResponse = this.getNodeParameter('includeResponse', itemIndex, false) as boolean;
				const timeoutMs = this.getNodeParameter('timeoutMs', itemIndex, 15000) as number;

				const payload = buildRadwarePayload({
					operation,
					apiKey: credentials.apiKey,
					userPrompt: this.getNodeParameter('userPrompt', itemIndex) as string,
					userIdentifier: this.getNodeParameter('userIdentifier', itemIndex) as string,
					userContext: this.getNodeParameter('userContext', itemIndex, '') as string,
					responseText:
						operation === 'checkResponse'
							? (this.getNodeParameter('responseText', itemIndex, '') as string)
							: undefined,
					modelToUse: this.getNodeParameter('modelToUse', itemIndex) as string,
					toolName:
						operation === 'checkToolAction'
							? (this.getNodeParameter('toolName', itemIndex) as string)
							: undefined,
					argsInput:
						operation === 'checkToolAction'
							? this.getNodeParameter('argsInput', itemIndex, {})
							: undefined,
					toolsInput: this.getNodeParameter('toolsInput', itemIndex, []),
				});

				let response: unknown;
				try {
					response = await this.helpers.httpRequest.call(this, {
						method: 'POST',
						url: credentials.endpoint,
						headers: {
							'content-type': 'application/json',
						},
						body: payload as unknown as IDataObject,
						json: true,
						timeout: timeoutMs,
					});
				} catch (error) {
					if (failMode === 'fail-open') {
						output.push({
							json: {
								...items[itemIndex].json,
								radware: {
									isBlocked: false,
									status: 'unavailable',
									eventId: '',
									module: '',
									failMode,
									blockReason: '',
									error: sanitizeForOutput(cleanError(error)),
								},
							},
							pairedItem: { item: itemIndex },
						});
						continue;
					}

					const reason = `Radware enforcement unavailable: ${cleanError(error)}`;
					if (blockHandling === 'error') {
						throw new NodeOperationError(this.getNode(), reason, { itemIndex });
					}
					output.push({
						json: {
							...items[itemIndex].json,
							radware: {
								isBlocked: true,
								status: 'unavailable',
								eventId: '',
								module: '',
								failMode,
								blockReason: reason,
							},
						},
						pairedItem: { item: itemIndex },
					});
					continue;
				}

				const decision = decisionFromRadwareResponse(response);
				if (decision.status === 'invalid-response' && failMode === 'fail-open') {
					decision.isBlocked = false;
					decision.status = 'unavailable';
					decision.blockReason = '';
				}

				if (decision.isBlocked && blockHandling === 'error') {
					const eventText = decision.eventId ? ` Event ID: ${decision.eventId}` : '';
					throw new NodeOperationError(
						this.getNode(),
						`${decision.blockReason || 'Blocked by Radware Agentic AI Protection'}.${eventText}`,
						{ itemIndex },
					);
				}

				output.push({
					json: {
						...items[itemIndex].json,
						radware: {
							isBlocked: decision.isBlocked,
							status: decision.status,
							eventId: decision.eventId,
							module: decision.module,
							failMode,
							blockReason: decision.blockReason,
							...(includeResponse ? { response: sanitizeForOutput(response) } : {}),
						},
					},
					pairedItem: { item: itemIndex },
				});
			} catch (error) {
				if (!this.continueOnFail()) {
					throw new NodeOperationError(this.getNode(), cleanError(error), { itemIndex });
				}

				output.push({
					json: {
						...items[itemIndex].json,
						error: cleanError(error),
					},
					pairedItem: { item: itemIndex },
				});
			}
		}

		return [output];
	}
}
