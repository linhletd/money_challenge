const http = require('http');
const redis = require('redis');

const client = redis.createClient();

const theLastests = '';

client.on('connect',()=>{
  console.log('redis connected');
  client.get('topten', (_, reply) =>{
    theLastests = new TheLastests(reply)
  })
  const server = http.createServer(requestHandler);
  server.listen(8080, ()=>{
    console.log('listening on port 8080')
  });
})

const requestHandler = (request, response)=>{
  const {url, method} = request;
  if(method === 'POST'){
    handlePostEvent(request, response)
  }
  else if(url === '/event/lastest'){
    handleGetLastestEvents(request, response)
  }
  else{
    handleFilterEvent(request, response)
  }
}

function handlePostEvent(request, response){
  request.on('readable', () => {
    let data = request.read();
    data && (body += data);
    });
    request.on('end', () => {
    response.end();
    })
}
function handleGetLastestEvents(_, response){
  response.end(theLastests)
}
function handleFilterEvent(request, response){
  const {page, size} = getPageSize(request.url);
  client
}
function getPageSize(url){

}

function Lastest(){
}