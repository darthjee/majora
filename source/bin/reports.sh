#!/bin/bash
# Run code quality reports

set -e

case "$1" in
    ci)
        poetry run xenon --max-absolute B --max-modules B --max-average A .
        ;;
    complexity)
        poetry run radon cc . -a
        ;;
    *)
        poetry run radon cc . -a
        poetry run xenon --max-absolute B --max-modules B --max-average A .
        ;;
esac
