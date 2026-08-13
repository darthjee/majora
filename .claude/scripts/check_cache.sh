#!/usr/bin/env bash
set -euo pipefail
set -x

python3 -c "import yaml; yaml.safe_load(open('navi/navi_config.yaml'))"

for f in navi/resources/*.yml; do
  python3 -c "import yaml, sys; yaml.safe_load(open(sys.argv[1]))" "$f"
done
