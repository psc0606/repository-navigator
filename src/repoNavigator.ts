import * as vscode from 'vscode';
import * as childProcess from 'child_process';
import * as path from 'path';
import { Repository, listRepositoriesAll, getRepositoryDetail } from './yunxiao';

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
            contextValue: 'repository', // Set context value for the item
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
        vscode.commands.registerCommand('repository-navigator.cloneRepository', async (repoNode: RepoNode) => {
            // Show a file dialog to select the target folder to clone into
            // TODO: set a default folder to clone into, make it configurable
            const folderUri = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                canSelectMany: false,
                openLabel: 'Select Folder',
            });

            if (folderUri && folderUri.length > 0) {
                const targetPath = folderUri[0].fsPath + path.sep + repoNode.data.name;
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Cloning repository...`,
                    cancellable: false,
                }, async () => {
                    try {
                        const repositoryDetail = await getRepositoryDetail(repoNode.data.id.toString());
                        console.log(`Cloning repository ${repositoryDetail} to ${targetPath}`);
                        await this.cloneRepository(repositoryDetail.httpUrlToRepo, targetPath);
                        await this.openFolder(targetPath);
                    } catch (error) {
                        vscode.window.showErrorMessage(`Failed to clone repository: ${error}`);
                    }
                });
            }
        });
    }

    private cloneRepository(repoUrl: string, targetPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            childProcess.exec(`git clone ${repoUrl} ${targetPath}`, (error, stdout, stderr) => {
                if (error) {
                    reject(stderr || error.message);
                } else {
                    resolve();
                }
            });
        });
    }

    private async openFolder(folderPath: string) {
        // Show a prompt to open the cloned repository
        const openOption = await vscode.window.showInformationMessage(
            `Do you want to open the cloned repository?`,
            { modal: true },
            'Open in Current Window',
            'Open in New Window'
        );

        if (openOption === 'Open in Current Window') {
            vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(folderPath), false);
        } else if (openOption === 'Open in New Window') {
            vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(folderPath), true);
        }
    }
}