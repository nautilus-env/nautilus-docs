# Install and First Run

Nautilus is a schema-first ORM toolkit built around a Rust query engine. You define your data model in a `.nautilus` file, validate it, apply schema changes to a live database, and generate local client code for your target language.

## Install Nautilus

### Python

```bash
pip install nautilus-orm
```

### JavaScript / TypeScript

```bash
npm install @nautilus-env/nautilus-orm
```

### Rust

```bash
cargo install nautilus-orm
```

### Platform installer scripts

macOS or Linux:

```bash
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/nautilus-env/nautilus/releases/latest/download/nautilus-orm-installer.sh | sh
```

Windows:

```powershell
powershell -ExecutionPolicy Bypass -c "irm https://github.com/nautilus-env/nautilus/releases/latest/download/nautilus-orm-installer.ps1 | iex"
```

### Check the CLI

```bash
nautilus --version
```

## A Minimal First Schema

If you want to start from scratch create a new file named `*.nautilus`, this is the smallest useful shape:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
  direct_url = env("DIRECT_DATABASE_URL") // Optional: for direct database access
}

generator client {
  provider  = "nautilus-client-py"
  output    = "./db"      // Optional: defaults to your language's modules directory
  interface = "async"     // Optional: defaults to "sync" if supported by the client
}

model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  name  String
}
```

Then run:

```bash
nautilus format --schema schema.nautilus
nautilus db push --schema schema.nautilus
```

The `--schema` flag is optional if you have a single `.nautilus` file in your project.
`db push` applies the live schema diff immediately. By default it also triggers client generation unless you pass `--no-generate`.
