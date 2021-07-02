const http = require('http');
const redis = require('redis');

const client = redis.createClient();


client.on('connect',()=>{
  console.log('redis connected');
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

}
function handleGetLastestEvents(request, response){

}
function handleFilterEvent(request, response){

}
function Lastest(){
  const topten;
  client.get('topten', (err))
}