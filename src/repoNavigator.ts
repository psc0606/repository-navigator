import * as vscode from 'vscode';
import { Repository, listRepositoriesAll } from './yunxiao';

export interface RepoNode {
    data: Repository;
}

export class RepoTreeDataProvider implements vscode.TreeDataProvider<RepoNode> {
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
            contextValue: 'repository',
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

    public refreshRepositories() {
        vscode.window.showInputBox({
            placeHolder: "Enter repository keyword",
            prompt: "Search repository by name"
        }).then((filterText) => {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Refreshing ",
                cancellable: false  // This is a non-cancelable progress
            }, async (progress) => {
                if (filterText) {
                    await listRepositoriesAll("", "", filterText, false, progress).then((repos) => {
                        this.items = repos.map(repo => ({
                            data: repo,
                        }));
                        this.refresh();
                    }).catch((err) => {
                        vscode.window.showErrorMessage(`Failed to refresh repositories: ${err}`);
                    });
                }
            });
        });
    }
}

export class RepoNavigator {
    private repoViewer: vscode.TreeView<RepoNode>;

    constructor(context: vscode.ExtensionContext) {
        const repoTreeDataProvider = new RepoTreeDataProvider(context);
        this.repoViewer = vscode.window.createTreeView('repositories', {
            treeDataProvider: repoTreeDataProvider,
            showCollapseAll: false,
        });
        context.subscriptions.push(this.repoViewer);
        vscode.commands.registerCommand('repository-navigator.refreshRepositories', () => repoTreeDataProvider.refreshRepositories());
    }
}