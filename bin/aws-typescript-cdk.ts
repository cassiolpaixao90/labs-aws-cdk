#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsTypescriptCdkStack } from '../lib/aws-typescript-cdk-stack';

const app = new cdk.App();
const stack = new AwsTypescriptCdkStack(app, 'AwsTypescriptCdkStack');
cdk.Tags.of(stack).add('App', 'DocumentManagement');
cdk.Tags.of(stack).add('Environment', 'Development');
