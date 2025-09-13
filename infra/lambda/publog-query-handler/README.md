PubLog NSQL Lambda (publog-query-handler)

This folder contains a minimal, deployable handler for the Lambda function that powers the NL→SQL "ask" endpoint.

Function details
- Name: publog-query-handler (existing in your AWS account)
- Runtime: Python 3.11
- Handler: app.handler
- Env vars (recommended):
  - ATHENA_DB=publog_gold
  - ATHENA_WORKGROUP=wg_publog_readonly (or primary)
  - ATHENA_OUTPUT=s3://publog-artifacts-user-dev-20250831/athena-results/ (optional; used if workgroup doesn’t enforce output location)

Deploy via GitHub Actions (recommended)
1) Create a GitHub OIDC role in AWS (or use existing):
   - Trusted entity: GitHub OIDC provider
   - Permissions: lambda:UpdateFunctionCode, s3:PutObject to your build artifacts bucket if used
   - Role ARN example: arn:aws:iam::590183893433:role/github-actions-deploy-lambda
2) Set repository variables/secrets:
   - Repository variable LAMBDA_FUNCTION_NAME=publog-query-handler
   - Repository variable AWS_REGION=us-east-1
   - Repository variable AWS_ACCOUNT_ID=590183893433
   - (If using OIDC) In workflow, set role-to-assume to your role ARN.
3) Push changes to main. The workflow will zip app.py and call aws lambda update-function-code.

Local packaging (optional)
```
cd infra/lambda/publog-query-handler
zip -r app.zip app.py
aws lambda update-function-code \
  --function-name publog-query-handler \
  --zip-file fileb://app.zip
```

