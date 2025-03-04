#!/usr/bin/env bash

PACKAGES=(
  "agent"
  "app"
  "bot-layer"
  "cdk"
  "cli"
  "core"
  "definitions"
  "eslint-config"
  "fhir-router"
  "fhirtypes"
  "hl7"
  "mock"
  "react"
)

for package in ${PACKAGES[@]}; do
  echo "Publish $package"
  pushd packages/$package
  npm publish --access public
  popd
done
