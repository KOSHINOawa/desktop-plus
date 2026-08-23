#!/bin/bash

# Exit if any command fails
set -e

cd /app

pnpm run test:setup
pnpm run test:unit
pnpm run test:script

echo '-------------------'
echo 'All tests passed 🎉'
echo '-------------------'
