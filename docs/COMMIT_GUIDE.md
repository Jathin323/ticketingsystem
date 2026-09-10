# Suggested commit sequence

The project is delivered as a complete tree. If you want a readable Git history
rather than one big commit, here's a sensible order to stage and commit in.
Set your identity first:

```bash
git init
git config user.name  "Your Name"
git config user.email "you@example.com"
```

Then commit in logical slices:

```bash
# 1. Tooling / scaffolding
git add .gitignore README.md docs/
git commit -m "chore: project scaffolding, gitignore, and README"

# 2. Backend foundation
git add backend/package.json backend/tsconfig.json backend/.gitignore backend/.env.example
git add backend/src/types.ts backend/src/db/index.ts
git commit -m "feat(api): database layer, schema migration, and domain types"

# 3. Backend validation + errors
git add backend/src/validation.ts backend/src/middleware/errorHandler.ts
git commit -m "feat(api): zod validation and central error handling"

# 4. Backend routes + server
git add backend/src/routes backend/src/app.ts backend/src/index.ts backend/src/db/seed.ts
git commit -m "feat(api): CRUD routes with filtering, search, sorting, pagination, and comments"

# 5. Backend tests
git add backend/tests
git commit -m "test(api): CRUD, validation, filtering, and error cases"

# 6. Frontend foundation
git add frontend/package.json frontend/tsconfig.json frontend/vite.config.ts \
        frontend/index.html frontend/.gitignore frontend/.env.example \
        frontend/src/main.tsx frontend/src/vite-env.d.ts frontend/src/types.ts \
        frontend/src/api/client.ts frontend/src/utils.ts frontend/src/index.css
git commit -m "feat(ui): app scaffold, design system, and typed API client"

# 7. Frontend components
git add frontend/src/components frontend/src/App.tsx
git commit -m "feat(ui): dashboard, filters, detail panel, and create flow"

# 8. Docker
git add docker-compose.yml backend/Dockerfile frontend/Dockerfile \
        frontend/nginx.conf frontend/.dockerignore
git commit -m "chore: docker setup for backend and frontend"
```
