#!/bin/bash

set -e

TEMP_DIR=$(mktemp -d)
trap "rm -rf ${TEMP_DIR}" EXIT

cd "${TEMP_DIR}"
wget https://github.com/brettcannon/cpython-wasi-build/releases/download/v3.12.0b2/python-3.12.0b2-wasi_sdk-20.zip
unzip python-3.12.0b2-wasi_sdk-20.zip
cd -

mkdir -p wasm/bin wasm/lib
cp "${TEMP_DIR}"/python.wasm wasm/bin/python.wasm
cp -r "${TEMP_DIR}"/lib/python3.12/* wasm/lib
dir-dump --out wasm/lib.dir.json wasm/lib
