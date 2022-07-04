import { strict as assert } from "assert";

import vscode from "vscode";
import { NeovimClient } from "neovim";

import {
    attachTestNvimClient,
    closeNvimClient,
    closeAllActiveEditors,
    wait,
    closeActiveEditor,
    sendVSCodeKeysAtomic,
    getVScodeCursor,
    getNeovimCursor,
    getVSCodeContent,
    getCurrentBufferContents,
} from "../utils";

describe("Neovim external buffers", () => {
    let client: NeovimClient;
    before(async () => {
        client = await attachTestNvimClient();
    });
    after(async () => {
        await closeNvimClient(client);
    });

    afterEach(async () => {
        await closeAllActiveEditors();
    });

    it("Opens VIM help", async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: "blah",
        });
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
        await wait();

        await sendVSCodeKeysAtomic(":help");
        await wait(1000);
        await vscode.commands.executeCommand("vscode-neovim.commit-cmdline");
        await wait(2000);

        const text = vscode.window.activeTextEditor!.document.getText();
        assert.ok(text.indexOf("main help file") !== -1);

        await sendVSCodeKeysAtomic(":help options");
        await wait(1000);
        await vscode.commands.executeCommand("vscode-neovim.commit-cmdline");
        await wait(2000);

        const text2 = vscode.window.activeTextEditor!.document.getText();
        assert.ok(text2.indexOf("VIM REFERENCE MANUAL") !== -1);

        await closeActiveEditor();
    });

    it("Cursor for external buffers is OK", async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: "blah",
        });
        await vscode.window.showTextDocument(doc);
        await wait();

        await sendVSCodeKeysAtomic(":help local-options");
        await wait(1000);
        await vscode.commands.executeCommand("vscode-neovim.commit-cmdline");
        await wait(3000);

        const vscodeCursor = getVScodeCursor();
        const neovimCursor = await getNeovimCursor(client);

        const cursorsEqual = vscodeCursor[0] === neovimCursor[0] && vscodeCursor[1] === neovimCursor[1];
        assert.ok(cursorsEqual, "editor and neovim cursor out of sync");

        // Text that we check for in order to see if the correct line is being shown
        const expectedHelpText = "*local-options*";

        const vscodeContent = getVSCodeContent();
        const vscodeLine = vscodeCursor[0];
        assert.ok(vscodeContent[vscodeLine].includes(expectedHelpText), "vscode cursor not at local-options help");

        const neovimContent = await getCurrentBufferContents(client);
        const neovimLine = neovimCursor[0];
        assert.ok(neovimContent[neovimLine].includes(expectedHelpText), "neovim cursor not at local-options help");
    });
});
