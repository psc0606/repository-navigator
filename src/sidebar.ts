import * as vscode from 'vscode';
import ThemeIcon from 'vscode';
import { listNamespaces, listNamespacesAll, Namespace, PageCursor, Repository } from './yunxiao';
import { error } from 'console';
import { removeFirstPart } from './utils';


class TreeNode extends vscode.TreeItem {
    data: any;
    children: TreeNode[] = [];

    constructor(
        public readonly label: string,
        iconPath?: vscode.Uri,
        collapsibleState?: vscode.TreeItemCollapsibleState,
        command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.command = command;
        this.iconPath = iconPath;
    }
}

// class IconTreeItem extends vscode.TreeItem {
//     constructor(label: string, icon_path: vscode.Uri, collapsibleState?: vscode.TreeItemCollapsibleState) {
//         super(label, collapsibleState || vscode.TreeItemCollapsibleState.None);
//         this.iconPath = {
//             light: icon_path,
//             dark: icon_path
//         };
//     }
// }

export class SidebarProvider implements vscode.TreeDataProvider<TreeNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeNode>;
    public readonly onDidChangeTreeData: vscode.Event<TreeNode>;
    private readonly _iconPath: vscode.Uri;
    private items: TreeNode[];
    private no_filtered_items: TreeNode[];

    constructor(context: vscode.ExtensionContext) {
        this._onDidChangeTreeData = new vscode.EventEmitter<TreeNode>();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this._iconPath = vscode.Uri.file(context.asAbsolutePath('images/icons/repo_blue.svg'));
        this.items = [
        ];
        this.no_filtered_items = [];
    }

    getTreeItem(element: TreeNode): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TreeNode): Thenable<TreeNode[]> {
        if (!element) {
            // Return root nodes
            return Promise.resolve(this.items);
        }
        // Return child nodes
        return Promise.resolve(element.children || []);
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    // buildTreeNode(namespaces: Namespace[]): TreeNode<Namespace>[] {
    //     const id2TreeNodeMap = new Map<number, TreeNode<Namespace>>();
    //     namespaces.forEach(namespace => {
    //         id2TreeNodeMap.set(namespace.id, {
    //             data: namespace,
    //             iconPath: this._iconPath,
    //             collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
    //             children: []
    //         });
    //     });

    //     const items: TreeNode<Namespace>[] = [];
    //     namespaces.forEach(namespace => {
    //         const parentTreeNode = id2TreeNodeMap.get(namespace.parentId);
    //         if (parentTreeNode) {
    //             parentTreeNode.children.push(id2TreeNodeMap.get(namespace.id)!);
    //         } else {
    //             items.push(id2TreeNodeMap.get(namespace.id)!);
    //         }
    //     });
    //     return items;
    // }

    // Refresh the tree view
    // refreshRepositories() {
    //     vscode.window.showInputBox({
    //         placeHolder: "Enter namespace keyword",
    //         prompt: "Search namespace by name"
    //     }).then((filterText) => {
    //         if (filterText) {
    //             vscode.window.withProgress({
    //                 location: vscode.ProgressLocation.Notification,
    //                 title: "Refreshing namespaces:",
    //                 cancellable: false  // This is a non-cancelable progress
    //             }, async (progress) => {
    //                 let page = 0;
    //                 let namespaces: Namespace[] = [];
    //                 let pageCursor: PageCursor;
    //                 const fetchNamespaces = async () => {
    //                     do {
    //                         const increment = Math.floor((1 / pageCursor?.x_total_pages) * 100) || 1;
    //                         progress.report({ message: `page ${page}...`, increment: increment });
    //                         const data = await listNamespaces("", page, 20, filterText, "", "desc");
    //                         namespaces.push(...data.namespaces);
    //                         pageCursor = data.pageCursor;
    //                         page += 1;
    //                     } while (pageCursor && page <= pageCursor.x_total_pages);
    //                     // yunxiao api may return duplicate namespaces when paginating
    //                     // deduplicate namespaces by id
    //                     const uniqueNamespaces = new Map<number, Namespace>();
    //                     namespaces.forEach(namespace => {
    //                         // console.log(namespace.name);
    //                         if (!uniqueNamespaces.has(namespace.id)) {
    //                             uniqueNamespaces.set(namespace.id, namespace);
    //                         }
    //                     });
    //                     namespaces = Array.from(uniqueNamespaces.values());
    //                 };

    //                 try {
    //                     await fetchNamespaces();
    //                     this.items = [];
    //                     this.buildTreeNode(namespaces).forEach(
    //                         namespace => {
    //                             this.items.push(namespace);
    //                         }
    //                     );
    //                     // Keep a copy of the original items for clear filtering
    //                     this.no_filtered_items.push(...this.items);
    //                     this.refresh();
    //                     vscode.window.showInformationMessage("Repository namespaces refreshed successfully.");
    //                 } catch (error) {
    //                     vscode.window.showErrorMessage(`Failed to fetch namespaces: ${error}`);
    //                 }
    //             });
    //         }
    //     });

    // }

    // Filter the tree view
    treeFilter() {
        vscode.window.showInputBox({
            placeHolder: "Enter filter text",
            prompt: "Filter repositories by name"
        }).then((filterText) => {
            if (filterText) {
                vscode.commands.executeCommand('setContext', 'repository-navigator-treeFilter-visible', false);
                this.items = this.no_filtered_items.filter(item => item.data.name.includes(filterText));
                this.refresh();
            }
        });
    }

    // Clear the filter
    clearFilter() {
        vscode.commands.executeCommand('setContext', 'repository-navigator-treeFilter-visible', true);
        this.items = [];
        this.items.push(...this.no_filtered_items);
        this.refresh();
    }

    // Handle tree item click event
    handleTreeItemClick(element: TreeNode) {
        console.log("Expanded: ", element.data);
        // vscode.window.withProgress({
        //     location: vscode.ProgressLocation.Window,
        //     title: "Refreshing ",
        //     cancellable: false  // This is a non-cancelable progress
        // }, async (progress) => {
        //     element.children = [];
        //     if ('kind' in element.data) {
        //         const namespace = element.data as Namespace;
        //         await listNamespacesAll(namespace.id.toString(), "", "", "desc", progress).then((namespaces) => {
        //             console.log("Expanded inner: ", namespaces);
        //             namespaces.forEach(namespace => {
        //                 console.log(namespace);
        //                 const treeNode = {
        //                     data: namespace,
        //                     iconPath: this._iconPath,
        //                     collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        //                     children: []
        //                 };
        //                 element.children.push(treeNode);
        //             });
        //         });
        //         await listGroupRepositories(namespace.id.toString(), 1, 20, "").then(data => {
        //             data.projects.forEach(project => {
        //                 console.log(project);
        //             });
        //         });
        //     } else {
        //         const repository = element.data as Repository;
        //     }
        //     this.refresh();
        // });
    }
}