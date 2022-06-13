const express=require('express');
const{json,urlencoded}=require('express');
const auth=require('./middlewares/auth');



var admin = require("firebase-admin");

var serviceAccount = require("./firebase.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


var db = admin.firestore();
const users=db.collection('users');

const userRouter=require('./routes/user');
const messageRouter=require('./routes/messages');


const app=express();

app.use(json());
app.use(urlencoded({extended:false}));
app.use(auth);


app.post('/add',(req,res)=>{
  res.send(req.body)
})


app.use('/user',userRouter)
app.use('/messages',messageRouter)

app.get('/',(req,res)=>{
    res.send("Hello from express")
})

app.post('/add', async (req,res)=>{
   const data = await  users.add({
       name:"ssp",
       "mobile":"8379268237"
   })
   res.send(data)
})

app.listen(5000);