const express = require('express');
const fetch = require('node-fetch');
const Memcached = require('memcached');
const app = express();

const PORT = 4000;

const memcached = new Memcached('localhost:11211',{retries:10,retry:10000,remove:true, failOverServers:['192.168.0.103:11211']});


async function getData(req, res) {

    try {
        console.log("Loading data .....");
        const username = req.body.username;
        
        const response = await fetch(`https://api.github.com/users/${username}`);

        const data = await response.json();

        const repo = data.public_repos;

        // set to Memcache
        memcached.set(username, repo , 10, (err) => {
          if (err) console.log(err);
          else console.log("Thanh cong!!");

        });

        res.status(200).json(repo);
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Get data fail!"})
    }
}

function cache(req, res, next) {

    const username  = req.body.username;

    memcached.get(username, (err, data) => {
        if (err) throw err;

        if (data !== undefined) {
          res.status(200).json({repos: data});
        } else {
          next();
        }
    });
}

app.use(express.json());
app.get('/', (req,res) => {

    res.send("Hello World!");
})

app.post('/repos/data', cache, getData);


app.listen(4000, () => {

    console.log(`App listening on port ${PORT}`);
})