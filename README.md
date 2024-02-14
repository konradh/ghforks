# GitHub Spork (Special Fork)

## Deployment on GitHub Pages

1. Set the variables `VITE_CLIENT_ID`, `VITE_OAUTH_APP_PROXY` and `VITE_BASE` in `.env.production` appropriately.
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