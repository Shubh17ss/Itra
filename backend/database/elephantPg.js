var pg = require('pg');

var conString = process.env.POSTGRES_CONNECTION;
var client=new pg.Client(conString);
client.connect();
module.exports=client;
