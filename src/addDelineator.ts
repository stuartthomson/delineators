import { SnippetString, TextEditor, TextEditorEdit } from "vscode";
import * as vscode from 'vscode';
import { ext } from "./extensionVariables";

// Create a string delineator of a given length
function createDelineator(position: number, endColumn: number, commentStart: string): string {
    let delineator = commentStart;
    for (let index = position + delineator.length; index < (endColumn - 1); index++) {
        delineator += '-';
    }
    delineator += '\n\n';
    return delineator;
}

// Get the prefix for starting a comment
function getCommentStart(textEditor: TextEditor, defaultComment: string): string {
    const currentLangId = textEditor.document.languageId;
    if (!ext.languageCommentMap.hasOwnProperty(currentLangId)) {
        return defaultComment;
    }
    return ext.languageCommentMap[currentLangId] || defaultComment;
}

// Get the configured line length
function getEndColumn(textEditor: TextEditor, defaultEndColumn: number): number {
    const config = vscode.workspace.getConfiguration("delineators", {languageId: textEditor.document.languageId});
    return config.get<number>("numberOfColumns", defaultEndColumn);
}

// Get the current cursor position
function getLineStart(textEditor: TextEditor): number {
    if (textEditor.selection.isEmpty) {
        return textEditor.selection.active.character;
    }
    return textEditor.selection.start.character;
}

// The command to add the delineator
export function addDelineator(textEditor: TextEditor, _: TextEditorEdit, args: any[]): void {
    // Create the string to add
    const delineator = createDelineator(
        getLineStart(textEditor),
        getEndColumn(textEditor, 100),
        getCommentStart(textEditor, '//')
    );

    // Insert as a snippet to the editor
    textEditor.insertSnippet(new SnippetString(delineator));
}