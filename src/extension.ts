// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { addDelineator } from './addDelineator';
import * as jsonc from 'jsonc-parser';
import { ext } from './extensionVariables';

function filterExtensionsPredicate(extension: vscode.Extension<any>): boolean {
	return extension.packageJSON.contributes && extension.packageJSON.contributes.languages;
}

// Surprisingly, it is not simple at all to get the language configurations currently active :shrug:
// https://github.com/microsoft/vscode/issues/2871
function getLanguageConfigs(): [string, vscode.LanguageConfiguration][] {
	const configs: [string, vscode.LanguageConfiguration][] = [];
	const languageExtensions = vscode.extensions.all.filter(filterExtensionsPredicate);

	for (const extension of languageExtensions) {

		// Each extension can actually contribute multiple languages
		for (const languageData of extension.packageJSON.contributes.languages) {
			// We need the id to construct the map
			// We need to make sure that the configuration field exists, and is a string
			// This indicates a path that has the config file
			if (languageData.id === undefined || languageData.configuration === undefined || typeof(languageData.configuration)!== 'string') {
				break;
			}

			// If found, get the absolute config file path
			const langConfigFilepath = path.join(extension.extensionPath, languageData.configuration);

			// If the file exists, read using jsonc parser
			if (!!langConfigFilepath && fs.existsSync(langConfigFilepath)) {
				const langConfig = jsonc.parse(fs.readFileSync(langConfigFilepath, 'utf-8'));
				configs.push([languageData.id, langConfig]);
			}
		}
	}
	return configs;
}

// Rearrange the data to be more useful
function createMap(configs: [string, vscode.LanguageConfiguration][]): {[languageId: string]: string} {
	const keyValues = configs.filter(
		config => config[1].comments !== undefined && config[1].comments.lineComment !== undefined
	).map(
		config => [config[0], config[1].comments?.lineComment]
	);
	return Object.fromEntries(keyValues);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	ext.languageCommentMap = createMap(getLanguageConfigs());

	let disposable = vscode.commands.registerTextEditorCommand('delineators.addDelineator', addDelineator);

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
