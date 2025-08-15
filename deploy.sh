#!/usr/bin/env sh

# abort on errors
set -e

# build
echo "Building the app..."
NODE_ENV=production npm run build

# navigate into the build output directory
cd build

# create a new git repository (only needed for manual deployment)
git init
git add -A
git commit -m 'deploy'

# push to the gh-pages branch
git push -f git@github.com:harshmandan/svelte-overflow-fade.git main:gh-pages

cd -

echo "Deployment complete!"