import * as vscode from 'vscode';
import { Namespace, listNamespacesAll } from './yunxiao';

export interface RepoNode {
    data: Namespace;
}

export class NamespaceTreeDataProvider implements vscode.TreeDataProvider<RepoNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
    readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;
    private readonly _iconPath: vscode.Uri;
    private items: RepoNode[] = [];

    constructor(context: vscode.ExtensionContext) {
        this._iconPath = vscode.Uri.file(context.asAbsolutePath('images/icons/repo_blue.svg'));
    }

    public refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: RepoNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return {
            label: element.data.name,
            iconPath: this._iconPath,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            // command: {
            //     command: 'repository-navigator.openRepo',
            //     title: 'Open Repository',
            //     arguments: [element.data],
            // },
            contextValue: 'namespace',
        };
    }

    getChildren(element?: RepoNode): vscode.ProviderResult<RepoNode[]> {
        if (!element) {
            // Return root nodes
            return Promise.resolve(this.items);
        }
        // Return child nodes
        return Promise.resolve([]);
    }

    public refreshNamespaces() {
        vscode.window.showInputBox({
            placeHolder: "Enter namespace keyword",
            prompt: "Search namespace by name"
        }).then((filterText) => {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Refreshing ",
                cancellable: false  // This is a non-cancelable progress
            }, async (progress) => {
                if (filterText) {
                    await listNamespacesAll("", filterText, "", "", progress).then((repos) => {
                        this.items = repos.map(repo => ({
                            data: repo,
                        }));
                        this.refresh();
                    }).catch((err) => {
                        vscode.window.showErrorMessage(`Failed to refresh namespaces: ${err}`);
                    });
                }
            });
        });
    }

    public handleTreeItemClick(element: RepoNode) {
        console.log("Expanded: ", element.data);
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Window,
            title: "Refreshing ",
            cancellable: false  // This is a non-cancelable progress
        }, async (progress) => {
        });
    }
}

export class NamespaceNavigator {
    private namespaceViewer: vscode.TreeView<RepoNode>;

    constructor(context: vscode.ExtensionContext) {
        const treeDataProvider = new NamespaceTreeDataProvider(context);
        this.namespaceViewer = vscode.window.createTreeView('namespaces', {
            treeDataProvider: treeDataProvider,
            showCollapseAll: false,
        });
        context.subscriptions.push(this.namespaceViewer);
        vscode.commands.registerCommand('repository-navigator.refreshNamespaces', () => treeDataProvider.refreshNamespaces());
    }
}