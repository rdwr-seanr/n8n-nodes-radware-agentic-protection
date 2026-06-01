import type {
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestOptions,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class RadwareInPathApi implements ICredentialType {
	name = 'radwareInPathApi';

	displayName = 'Radware In-Path API';

	documentationUrl = 'https://github.com/rdwr-seanr/n8n-nodes-radware-agentic-protection#credentials';

	icon: Icon = { light: 'file:../icons/radware-mark.svg', dark: 'file:../icons/radware-mark.dark.svg' };

	properties: INodeProperties[] = [
		{
			displayName: 'Radware API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'The API key copied from the Radware homegrown agent configured for in-path enforcement in https://console.radwarecloud.com/',
		},
		{
			displayName: 'Provider',
			name: 'provider',
			type: 'options',
			default: 'openai',
			options: [
				{
					name: 'OpenAI',
					value: 'openai',
				},
				{
					name: 'Anthropic',
					value: 'anthropic',
				},
				{
					name: 'Google',
					value: 'google',
				},
				{
					name: 'Custom',
					value: 'custom',
				},
			],
			description: 'Provider segment used in Radware in-path URLs',
		},
		{
			displayName: 'Custom Provider Segment',
			name: 'customProviderSegment',
			type: 'string',
			default: '',
			placeholder: 'openai-compatible-provider',
			displayOptions: {
				show: {
					provider: ['custom'],
				},
			},
			description: 'Provider segment to append to https://api.agentic.radwarecto.com/v1/',
		},
		{
			displayName: 'Resolved Base URL',
			name: 'baseUrl',
			type: 'string',
			default: '',
			placeholder: 'https://api.agentic.radwarecto.com/v1/openai',
			description:
				'Optional full Radware in-path base URL. If empty, the node uses https://api.agentic.radwarecto.com/v1/<provider>.',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL:
				'={{$credentials.baseUrl || "https://api.agentic.radwarecto.com/v1/" + (($credentials.provider === "custom" ? $credentials.customProviderSegment : $credentials.provider) || "openai")}}',
			url: '/models',
		},
	};

	async authenticate(
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		requestOptions.headers ??= {};
		requestOptions.headers.Authorization = `Bearer ${credentials.apiKey}`;

		return requestOptions;
	}
}
