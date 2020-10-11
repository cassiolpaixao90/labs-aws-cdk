import * as cdk from '@aws-cdk/core';
import { Bucket, BucketEncryption } from "@aws-cdk/aws-s3";
import * as s3Deploy from "@aws-cdk/aws-s3-deployment";
import * as path from 'path';

import { Networking } from './networking';
import { DocumentManagementApi } from './api';
import { DocumentManagementWebserver } from './webserver';

export class AwsTypescriptCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, 'DocumentsBucket', {
      encryption: BucketEncryption.S3_MANAGED
    });

    new s3Deploy.BucketDeployment(this, 'DocumentsDeployment', {
        sources: [
          s3Deploy.Source.asset(path.join(__dirname, '..', 'documents'))
        ],
        destinationBucket: bucket,
        memoryLimit: 512
    });
    
    new cdk.CfnOutput(this, 'DocumentsBucketNameExport', {
      value: bucket.bucketName,
      exportName: 'DocumentsBucketName'   
    });

    const networkingStack = new Networking(this, 'NetworkingConstruct', {
        maxAzs: 2
    }); 
    cdk.Tags.of(networkingStack).add('Module', 'Networking');

    const api = new DocumentManagementApi(this, 'DocumentManagementAPI', {
      documentBucket: bucket
    });
    cdk.Tags.of(api).add('Module', 'Api');

    
    const webserver = new DocumentManagementWebserver(this, 'DocumentManagementWebserver', {
      vpc: networkingStack.vpc,
      api: api.httpApi
    });

    cdk.Tags.of(webserver).add('Module', 'Webserver');

  }
}
