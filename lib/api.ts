import * as path from 'path';
import * as cdk  from '@aws-cdk/core';
import * as s3 from "@aws-cdk/aws-s3";
import * as lambda  from '@aws-cdk/aws-lambda-nodejs';
import * as iam from '@aws-cdk/aws-iam';
import * as apig from '@aws-cdk/aws-apigatewayv2';
import { Runtime } from '@aws-cdk/aws-lambda';

interface DocumentManagementApiProps {
    documentBucket: s3.IBucket
}

export class DocumentManagementApi extends cdk.Construct {
    public readonly httpApi: apig.HttpApi

    constructor(scope: cdk.Construct, id: string, props: DocumentManagementApiProps) {
        super(scope, id);

        const getDocumentsFunction = new lambda.NodejsFunction(this, 'GetDocumentsFunction', {
          runtime: Runtime.NODEJS_12_X,
          entry: path.join(__dirname, '..', 'api', 'getDocuments', 'index.ts'),
          handler: 'getDocuments',
          externalModules: [
            'aws-sdk'
          ],
          environment: {
            DOCUMENTS_BUCKET_NAME: props.documentBucket.bucketName
          }
        })
    
        const bucketPermissions = new iam.PolicyStatement();
        bucketPermissions.addResources(`${props.documentBucket.bucketArn}/*`);
        bucketPermissions.addActions('s3:GetObject', 's3:PutObject')
        getDocumentsFunction.addToRolePolicy(bucketPermissions)
    
        const bucketContainerPermissions = new iam.PolicyStatement();
        bucketContainerPermissions.addResources(props.documentBucket.bucketArn);
        bucketContainerPermissions.addActions('s3:ListBucket')
        getDocumentsFunction.addToRolePolicy(bucketContainerPermissions)
    
        this.httpApi = new apig.HttpApi(this, 'HttpAPI', {
          apiName: 'document-management-api',
          createDefaultStage: true,
          corsPreflight: {
            allowMethods: [ apig.HttpMethod.GET ],
            allowOrigins: ['*'],
            maxAge: cdk.Duration.days(10),
          }
        });
    
        const integration = new apig.LambdaProxyIntegration({
          handler: getDocumentsFunction
        });
    
        this.httpApi.addRoutes({
          path: '/getDocuments',
          methods: [
            apig.HttpMethod.GET
          ],
          integration: integration
        });
    
        new cdk.CfnOutput(this, 'APIEndpoint', {
          value: this.httpApi.url!,
          exportName: 'APIEndpoint'
        })      
    }
}