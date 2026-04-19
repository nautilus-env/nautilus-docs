# How Nautilus Works

Nautilus is easiest to understand as a pipeline that begins with a schema file and ends with client operations talking to a database through a dedicated runtime.

## The Short Version

1. You write a `.nautilus` schema.
2. Nautilus parses and validates it.
3. The CLI can format it, diff it against a live database, or generate client code from it.
4. Generated clients call the Nautilus engine over JSON-RPC on `stdin` and `stdout`.
5. The engine renders SQL for the chosen provider and executes it through connector code.

## User-Facing Pieces

| Piece | What you use it for |
| --- | --- |
| `.nautilus` schema file | The source of truth for models, enums, relations, defaults, indexes, and generator settings |
| `nautilus` CLI | Validation, formatting, `db` commands, migrations, generation, engine startup, Python shim management, and Studio lifecycle |
| Generated client | Language-specific API for CRUD, transactions, filters, includes, and local app code |
| Engine | Runtime process used by generated clients |
| LSP and VS Code extension | Diagnostics, completions, hover, go-to-definition, formatting, semantic tokens |

## The End-to-End Flow

| Stage | What happens | Why it matters |
| --- | --- | --- |
| Schema authoring | You define datasource, generator, models, enums, and types | One file controls both database shape and generated client structure |
| Validation | Lexer, parser, and validator check syntax and semantics | You catch naming errors, relation mistakes, type mismatches, and provider incompatibilities early |
| Database workflow | `db status`, `db push`, or migration commands compare target schema to live database state | You can work in direct schema-sync mode or versioned migration mode |
| Generation | `nautilus generate` writes local client artifacts | Your application imports local generated code, not a published registry package |
| Runtime execution | Generated clients talk to the engine | Query behavior stays consistent across languages |

## Why Schema-First Matters Here

Nautilus uses the schema for more than table creation:

- it defines logical names and mapped physical names
- it drives generated filter, select, and relation APIs
- it controls database diffing and migration SQL generation
- it powers editor diagnostics and completions

That means a schema change affects both the database surface and the generated client surface.

## What Nautilus Does Not Hide

Nautilus gives you a higher-level workflow, but it still exposes database reality:

- provider differences are real and documented
- some index types only exist on specific backends
- `db push` can be destructive
- migration review still matters in production
- generated clients are local artifacts that belong in your app or workspace