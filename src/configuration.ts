import * as vscode from 'vscode';

export class YunxiaoConfig {
    static get config() {
        return vscode.workspace.getConfiguration('repository-navigator.yunxiao');
    }

    static get domain(): string {
        return this.config.get<string>('domain', '');
    }

    static get token(): string {
        return this.config.get<string>('token', '');
    }

    static get organizationId(): string {
        return this.config.get<string>('organizationId', '');
    }
}