import type { ICredentialTestRequest, ICredentialType, INodeProperties, Icon } from 'n8n-workflow';

export class RadwareOutOfPathApi implements ICredentialType {
	name = 'radwareOutOfPathApi';

	displayName = 'Radware Out-of-Path API';

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
				'The API key copied from the Radware homegrown agent configured for out-of-path enforcement in https://console.radwarecloud.com/',
		},
		{
			displayName: 'Endpoint',
			name: 'endpoint',
			type: 'string',
			default: 'https://api.agentic.radwarecto.com/llmp/digester/agentic-api',
			required: true,
			description: 'Radware out-of-path explicit API endpoint',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			method: 'POST',
			url: '={{$credentials.endpoint}}',
			headers: {
				'content-type': 'application/json',
			},
			body: {
				UserPrompt: 'Radware credential connectivity test',
				UserIdentifier: 'n8n-credential-test',
				ApiKey: '={{$credentials.apiKey}}',
				ModelToUse: 'gpt-4o',
			},
		},
	};
}
