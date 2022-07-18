const path = require('path');
const http = require('http');
const Koa = require('koa');
const app = new Koa();
const cors = require('@koa/cors');
const koaBody = require('koa-body');
const fs = require('fs');
const {v4: uuidv4} = require('uuid');
const dataBase = path.join(__dirname, './bd/bd.json');
const port = process.env.PORT || 9090;


app.use(cors());
app.use(koaBody({
    urlencoded: true,
    json: true,
    multipart: true
}))

app.use(async ctx => {
    switch(ctx.request.method){
        case 'GET':
            if(ctx.request.querystring === 'allTickets'){
                const bd = JSON.parse(fs.readFileSync(dataBase, 'utf-8'));
                const responseArr = [];

                for(let key in bd){bd[key].forEach(item => { responseArr.push(item) })}
                ctx.response.body = responseArr;

                break;
            } else if(ctx.request.query.option === 'deleteTicket'){
                const id = ctx.request.query.id;
                const bd = JSON.parse(fs.readFileSync(dataBase, 'utf-8'));

                for(let key in bd) {
                    const index = bd[key].findIndex(item => item.id === id)
                    if(index !== -1){
                        bd[key].splice(index, 1);
                    };
                }
                ctx.response.body = true;
                fs.writeFileSync(dataBase, JSON.stringify(bd, null, ' '));
                break;
            }
            break;
        
        case 'POST':
            const bd = JSON.parse(fs.readFileSync(dataBase, 'utf-8'));
            const data = ctx.request.body;

            if(data.changeStatus !== undefined) {
                for(let key in bd) {
                    bd[key].forEach(item => {
                        if(item.id === data.id) {
                            item.status = data.status;
                            ctx.response.body = item.status;
                            fs.writeFileSync(dataBase, JSON.stringify(bd, null, ' '));
                        }
                    })
                }
                break;
            }

            if(data.id !== 'null'){
                if(data.description === '') {
                    bd.fullTickets.forEach(item => {
                        if(item.id === data.id) {
                            data.created = item.created;
                            delete data.description;
                            const index = bd.fullTickets.findIndex(item => item.id === data.id);
                            bd.tickets.push(data);
                            bd.fullTickets.splice(index, 1);
                            fs.writeFileSync(dataBase, JSON.stringify(bd, null, ' '));
                            ctx.response.body = data;
                        }
                    })

                    bd.tickets.forEach(item => {
                        if(item.id === data.id){
                            item.status = data.status;
                            item.name = data.name;
                            fs.writeFileSync(dataBase, JSON.stringify(bd, null, ' '));
                            ctx.response.body = data;
                        }
                    })
                } else if(data.description !== '') {
                    bd.tickets.forEach(item => {
                        if(item.id === data.id) {
                            data.created = item.created;
                            const index = bd.tickets.findIndex(item => item.id === data.id);
                            bd.fullTickets.push(data);
                            bd.tickets.splice(index, 1);
                            fs.writeFileSync(dataBase, JSON.stringify(bd, null, ' '));
                            ctx.response.body = data;
                        }
                    })

                    bd.fullTickets.forEach(item => {
                        if(item.id === data.id){
                            item.status = data.status;
                            item.name = data.name;
                            item.description = data.description;
                            fs.writeFileSync(dataBase, JSON.stringify(bd, null, ' '));
                            ctx.response.body = data;
                        }
                    })
                }
                break;
            } else {
                data.id = uuidv4();

                if(data.description !== '') {
                    bd.fullTickets.push(data);
                } else {
                    delete data.description;
                    bd.tickets.push(data);
                }

                ctx.response.body = data;
                fs.writeFileSync(dataBase, JSON.stringify(bd, null, ' '));
                break;
            }
    }
})

const server = http.createServer(app.callback()).listen(port);