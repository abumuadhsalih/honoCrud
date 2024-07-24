import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class MyAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB table
    const table = new dynamodb.Table(this, 'ItemsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY // NOT recommended for production code
    });

    // Create Lambda function
    const fn = new NodejsFunction(this, 'lambda', {
      entry: 'lambda/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        TABLE_NAME: table.tableName
      }
    })
    fn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    })
    // new apigateway.LambdaRestApi(this, 'myapi', {
    //   handler: fn,
    // })
    // const lambdaFunction = new lambda.Function(this, 'HonoLambdaHandler', {
    //   runtime: lambda.Runtime.NODEJS_14_X,
    //   code: lambda.Code.fromAsset('lambda'),
    //   handler: 'index.handler',
    //   environment: {
    //     TABLE_NAME: table.tableName
    //   }
    // });

    // Grant Lambda function permissions to access DynamoDB table
    table.grantReadWriteData(fn);

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'HonoApi', {
      restApiName: 'Hono Service',
      description: 'This service serves Hono endpoints.'
    });

    const items = api.root.addResource('items');
    const singleItem = items.addResource('{id}');

    const lambdaIntegration = new apigateway.LambdaIntegration(fn);

    items.addMethod('POST', lambdaIntegration);
    singleItem.addMethod('GET', lambdaIntegration);
    singleItem.addMethod('PUT', lambdaIntegration);
    singleItem.addMethod('DELETE', lambdaIntegration);
  }
}