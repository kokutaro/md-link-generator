// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const re = /^#+\s+(?<word>.*?)$/gm;
  let command = vscode.commands.registerCommand(
    'md-link-generator.generateLinks',
    async () => {
      const doc = vscode.window.activeTextEditor?.document;
      const editor = vscode.window.activeTextEditor;
      if (!doc || !editor) {
        return;
      }
      const text = doc.getText() || '';
      let match = re.exec(text);
      if (!match) {
        return;
      }
      let links = [];
      do {
        if (match?.groups?.word) {
          links.push({
            p: '#' + match.groups.word.toLowerCase().replace(/\s/, '-'),
            w: match.groups.word,
          });
        }
      } while ((match = re.exec(text)) !== null);

      let isInCode = false;
      for (let i = 0; i < doc.lineCount; i++) {
        let line = doc.lineAt(i);
        if (/^`{3}/.test(line.text)) {
          if (isInCode) {
            isInCode = false;
          } else {
            isInCode = true;
          }
          continue;
        }
        if (isInCode) {
          continue;
        }
        if (line.text[0] === '#' || line.isEmptyOrWhitespace) {
          continue;
        }

        let pos = 0;

        for (const l of links.sort((a, b) => b.w.length - a.w.length)) {
          let index = 0;

          while (index >= 0) {
            index = line.text.indexOf(l.w, pos);
            if (index < 0) {
              continue;
            }
            if (
              (index > 0 &&
                /\[|`/.test(line.text[index - 1]) &&
                /\]|`/.test(line.text[index + l.w.length])) ||
              line.text[index - 1] === '#'
            ) {
              pos = index + l.w.length;
              continue;
            }

            pos = index + l.w.length;
            var rng = new vscode.Range(
              line.lineNumber,
              index,
              line.lineNumber,
              index + l.w.length
            );

            await editor.edit((e) => {
              e.replace(rng, `[${l.w}](${l.p})`);
            });
            line = doc.lineAt(i);
          }
        }
      }

      doc.save();
    }
  );

  context.subscriptions.push(command);
}

// this method is called when your extension is deactivated
export function deactivate() {}
