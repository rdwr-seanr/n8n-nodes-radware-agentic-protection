import type {
	ICredentialDataDecryptedObject,
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { supplyModel } from '@n8n/ai-node-sdk';

type ModelOptions = {
	temperature?: number;
	maxTokens?: number;
	timeoutMs?: number;
};

type RadwareInPathCredentials = ICredentialDataDecryptedObject & {
	apiKey: string;
	provider?: string;
	customProviderSegment?: string;
	baseUrl?: string;
};

function cleanSegment(value: string): string {
	return value.trim().replace(/^\/+|\/+$/g, '').toLowerCase();
}

function resolveBaseUrl(credentials: RadwareInPathCredentials): string {
	const configuredBaseUrl = String(credentials.baseUrl ?? '').trim();
	if (configuredBaseUrl) {
		return configuredBaseUrl.replace(/\/+$/g, '');
	}

	const provider =
		credentials.provider === 'custom'
			? cleanSegment(String(credentials.customProviderSegment ?? 'openai'))
			: cleanSegment(String(credentials.provider ?? 'openai'));

	return `https://api.agentic.radwarecto.com/v1/${provider || 'openai'}`;
}

export class RadwareChatModel implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Radware Chat Model',
		name: 'radwareChatModel',
		icon: { light: 'file:../../icons/radware-mark.svg', dark: 'file:../../icons/radware-mark.dark.svg' },
		group: ['transform'],
		version: [1],
		description: 'Use Radware Agentic AI Protection as an in-path OpenAI-compatible chat model',
		defaults: {
			name: 'Radware Chat Model',
		},
		subtitle: '={{$parameter["model"]}}',
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models', 'Root Nodes'],
				'Language Models': ['Chat Models (Recommended)'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://github.com/Radware/n8n-nodes-radware-agentic-protection/blob/main/docs/in-path.md',
					},
					{
						url: 'https://console.radwarecloud.com/',
					},
				],
			},
		},
		inputs: [],
		outputs: [NodeConnectionTypes.AiLanguageModel],
		outputNames: ['Model'],
		credentials: [
			{
				name: 'radwareInPathApi',
				required: true,
			},
		],
		properties: [
			{
				displayName:
					'Create an in-path homegrown agent in <a href="https://console.radwarecloud.com/" target="_blank">Radware Cloud</a>, then connect this node to the n8n AI Agent as its Chat Model. Do not connect a direct provider chat model to the same agent path.',
				name: 'inPathSetupNotice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				default: 'gpt-4o',
				required: true,
				description: 'The model name Radware should forward to the configured provider',
			},
			{
				displayName: 'Options',
				name: 'options',
				placeholder: 'Add Option',
				description: 'Additional model options',
				type: 'collection',
				default: {},
				options: [
					{
						displayName: 'Sampling Temperature',
						name: 'temperature',
						default: 0.7,
						typeOptions: { maxValue: 2, minValue: 0, numberPrecision: 1 },
						description:
							'Controls randomness. Lower values make responses more deterministic.',
						type: 'number',
					},
					{
						displayName: 'Max Tokens',
						name: 'maxTokens',
						type: 'number',
						default: 1024,
						typeOptions: { minValue: 1 },
						description: 'Maximum number of tokens to generate',
					},
					{
						displayName: 'Timeout',
						name: 'timeoutMs',
						type: 'number',
						default: 30000,
						typeOptions: { minValue: 1000, maxValue: 120000 },
						description: 'Maximum time in milliseconds to wait for Radware/provider response',
					},
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number) {
		const credentials = (await this.getCredentials('radwareInPathApi')) as RadwareInPathCredentials;
		const modelParameter = this.getNodeParameter('model', itemIndex, 'gpt-4o') as string;
		const model = modelParameter.trim() || 'gpt-4o';
		const options = this.getNodeParameter('options', itemIndex, {}) as ModelOptions;

		return supplyModel(this, {
			type: 'openai',
			baseUrl: resolveBaseUrl(credentials),
			apiKey: credentials.apiKey,
			model,
			temperature: options.temperature,
			maxTokens: options.maxTokens,
			streaming: false,
			timeout: options.timeoutMs,
		});
	}
}
