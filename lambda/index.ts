import { Hono } from 'hono'
import { handle } from 'hono/aws-lambda'
const AWS = require('aws-sdk');

const app = new Hono();
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME;

app.post('/items', async (c) => {
    const item = await c.req.json();
    const params = {
        TableName: TABLE_NAME,
        Item: item
    };
    await dynamoDb.put(params).promise();
    return c.json({ message: 'Item created', item }, 201);
});

app.get('/items/:id', async (c) => {
    const { id } = c.req.param();
    const params = {
        TableName: TABLE_NAME,
        Key: { id }
    };
    const result = await dynamoDb.get(params).promise();
    if (result.Item) {
        return c.json(result.Item);
    } else {
        return c.json({ message: 'Item not found' }, 404);
    }
});

app.put('/items/:id', async (c) => {
    const { id } = c.req.param();
    const updatedItem = await c.req.json();
    updatedItem.id = id;
    const params = {
        TableName: TABLE_NAME,
        Item: updatedItem
    };
    await dynamoDb.put(params).promise();
    return c.json({ message: 'Item updated', updatedItem });
});

app.delete('/items/:id', async (c) => {
    const { id } = c.req.param();
    const params = {
        TableName: TABLE_NAME,
        Key: { id }
    };
    await dynamoDb.delete(params).promise();
    return c.json({ message: 'Item deleted' });
});

export const handler = handle(app)