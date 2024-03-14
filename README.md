# GitHub Sporks

Find **sp**ecial **forks** of GitHub projects.

**This project is very much work in progress.**

## Development setup

1. Copy `.env.example` to `.env.development` and change the variables appropriately.
2. `npm install`
3. `npm run dev`

## Deployment on GitHub Pages

1. Copy `.env.example` to `.env.production` and change the variables appropriately.
2. Build the Vite project. This will place the page in the `dist/` folder.
   ```shell
   npm run build
   ```
3. Go to the worktree at `dist/`, commit and push.
   ```shell
   cd dist
   git add .
   git commit
   git push
   ```
