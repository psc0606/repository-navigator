import * as vscode from 'vscode';
import { RepoNavigator } from './repoNavigator';
import { NamespaceNavigator } from './namespaceNavigator';

export function activate(context: vscode.ExtensionContext) {
    // sidebarView.onDidExpandElement((e) => sidebarProvider.handleTreeItemClick(e.element));

    // function setButtonsContext() {
    //     vscode.commands.executeCommand('setContext', 'repository-navigator-treeFilter-visible', true);
    // }
    // setButtonsContext();

    new RepoNavigator(context);
    new NamespaceNavigator(context);
}