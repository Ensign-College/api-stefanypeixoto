#!/bin/bash
git pull
npm install
zip -r lambda-function-stefany.zip .
sam deploy --guided