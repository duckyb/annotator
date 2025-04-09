#!/bin/bash

# Script to run ESLint and fix common issues

# Create the directory if it doesn't exist
mkdir -p "$(dirname "$0")"

echo "Running ESLint to fix common issues..."

# Run ESLint with the fix option
yarn lint:fix

# Check the exit code
if [ $? -eq 0 ]; then
  echo "✅ ESLint completed successfully!"
else
  echo "⚠️ ESLint found issues that couldn't be automatically fixed."
  echo "   Please check the output above and fix the remaining issues manually."
fi

echo ""
echo "To run ESLint without fixing issues (just to check), use:"
echo "yarn lint"
