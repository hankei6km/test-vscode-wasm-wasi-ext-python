import { commands, ExtensionContext, Uri, workspace } from 'vscode'
import { Wasm, ProcessOptions, RootFileSystem, Stdio } from '@vscode/wasm-wasi'

export async function activate(context: ExtensionContext) {
  const wasm: Wasm = await Wasm.load()

  // https://github.com/microsoft/vscode-wasm/blob/main/testbeds/python/extension.ts
  commands.registerCommand(
    'wasm-wasi-python.webshell',
    async (
      _command: string,
      args: string[],
      cwd: string,
      stdio: Stdio,
      rootFileSystem: RootFileSystem
    ): Promise<number> => {
      // WASI doesn't support the concept of an initial working directory.
      // So we need to make file paths absolute.
      // See https://github.com/WebAssembly/wasi-filesystem/issues/24
      const optionsWithArgs = new Set([
        '-c',
        '-m',
        '-W',
        '-X',
        '--check-hash-based-pycs'
      ])
      for (let i = 0; i < args.length; i++) {
        const arg = args[i]
        if (optionsWithArgs.has(arg)) {
          const next = args[i + 1]
          if (next !== undefined && !next.startsWith('-')) {
            i++
            continue
          }
        } else if (arg.startsWith('-')) {
          continue
        } else if (!arg.startsWith('/')) {
          args[i] = `${cwd}/${arg}`
        }
      }
      const options: ProcessOptions = {
        stdio,
        rootFileSystem,
        env: {
          PYTHONPATH: '/workspace'
        },
        args: ['-B', '-X', 'utf8', ...args],
        trace: true
      }
      const filename = Uri.joinPath(
        context.extensionUri,
        'wasm',
        'bin',
        'python.wasm'
      )
      const bits = await workspace.fs.readFile(filename)
      const module = await WebAssembly.compile(bits)
      const process = await wasm.createProcess('python', module, options)
      const result = await process.run()
      return result
    }
  )
}

export function deactivate() {}
