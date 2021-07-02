const http = require('http');
const redis = require('redis');

const client = redis.createClient();

let theState;
client.on('connect',()=>{
  console.log('redis connected...');
  console.log('Initalizing...')
  client.get('total', (err, reply) =>{
    new Promise(resolve =>{
      if(reply){
        resolve(Number(reply))
      }
      else{
        client.set('total', 0, (err)=>{
          if(!err){
            resolve(0)
          }
        })
      }
    }).then(total =>{
      console.log('Total exist record: ', total);
      total = Number(total);
      if(total === 0){
        return {records: [], total}
      }
      const lowerLimit = total >= 10 ? total - 9 : 1;
      const promiseArray = [];
      for(let i = total; i >= lowerLimit; i-- ){
        promiseArray.push(new Promise((resolve, reject) =>{
          client.get(i, (err, record) =>{
            if(err){
              reject(err)
            }
            else{
              resolve(record)
            }
          })
        }))
      }
      return Promise.all(promiseArray).then((records) =>({records, total}))
    }).then(({records, total}) =>{
      console.log('Top records: ', records)
      theState = new State(records, Number(total));``
      console.log('Initialization completed');
    
      const server = http.createServer(requestHandler);
      server.listen(8080, ()=>{
        console.log('Server is ready on port 8080')
      });
    
    }).catch(_ =>{
      console.log('error occurs :(');
    });
    if(err) console.log('error occurs :(');
  })
})



const requestHandler = (request, response)=>{
  // const {url, method} = request;
  // console.log(url, method);
  if(url === '/event/create'){
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
  let body = '';
  request.on('readable', () => {
    let data = request.read();
    data && (body += data);
    });
    request.on('end', () => {
      theState.addNewItem(body);
      response.end();
  });
  
}
function handleGetLastestEvents(_, response){
  response.end(theState.getLastests())
}

function handleFilterEvent(request, response){
  const {page, size} = getPageSize(request.url);
  if(!page || !size){
    response.end();
    return;
  }
  const maxPage = Math.ceil(theState.getCurIdx()/size);
  if(page > maxPage){
    response.end('[]');
    return;
  }
  if(page < maxPage){
    const cacheKey = `p${page}_${size}`;
    client.get(cacheKey, (err, data)=>{
        if(data){
          response.end(data)
        }
        else{
          responseWithPaginatedData({page, size}, maxPage, response, cacheKey);
        }
    })
  }
  else{
    responseWithPaginatedData({page, size}, maxPage, response);
  }
}


function responseWithPaginatedData({page, size}, maxPage, response, cached, cacheKey){
  const start = (page - 1) * size + 1;
  const end = page === maxPage ? theState.getCurIdx() : page * size;
  const promiseArray = [];
  for(let i = start; i <= end; i++){
    promiseArray.push(new Promise((resolve, reject) =>{
      client.get(i, (err, data) =>{
        if(data){
          resolve(data);
          return;
        }
        reject(err)
      })
    }))
  }
  Promise.all(promiseArray).then((data)=>{
    data = JSON.stringify(data);
    response.end(data);
    if(page < maxPage && cacheKey){
      client.set(cacheKey, data)
    }
  }).catch((e)=>{
    response.end()
  })

}
function getPageSize(url){
  const splited = url.split(/\?|=|&/g).slice(1);
  return {
    [splited[0]]: Number(splited[1]),
    [splited[2]]: Number(splited[3])
  }
}


function State(initial, total){

  const data = initial ? initial : [];
  
  this.stringifiedData = null;
  this.curIdx = total;

  this.getLastests = ()=>{
    if(!this.stringifiedData){
      this.stringifiedData = JSON.stringify(data)
    }
    return this.stringifiedData;
  }
  this.addNewItem = (item) =>{
    if(data.length === 10){
      data.pop();
    }
    data.unshift(item);
    // console.log(data);
    this.stringifiedData = null;
    this.curIdx += 1;
    client.set(this.curIdx, item, (err) =>{
      if(!err){
        client.incr('total');
      }
    });
  }
  this.getCurIdx = ()=>{
    return this.curIdx;
  }
}
