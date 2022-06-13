const {Router}=require('express');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');


const admin=require('firebase-admin');

const db=admin.firestore();
const Users=db.collection('Users');


const router=new Router(); 


router.post('/register',async(req,res)=>{
    try{
        const checkUser=await Users.where("email","==",req.body.email).get()
        const {password}=req.body;
        const salt=await bcrypt.genSalt();
        const hash=await bcrypt.hash(password,salt);
        if(checkUser.empty){
            const data=await Users.add({
                ...req.body,
                password:hash
            })
            res.send(data)
        }
        else{
            res.send({
                err:"Email already registered"
            })
        }
    }
    catch(err){
        res.send(err)
    }
});

router.post("/login", async (req,res) => {
    try {
        const checkUser = await Users.where("email","==",req.body.email).get()
        if(checkUser.empty) {
            res.send({
                err: "Email is not Registered"
            })
        }
        else {
            let userData = [];
            checkUser.docs.forEach((e) => {
                userData = {
                    ...e.data(),
                    id:e.id
                }
            })
            const {password : storepassword} = userData;
            const {password} = req.body;
            const compare = await bcrypt.compare(password, storepassword)
            if(compare) {
                const token = jwt.sign({
                    id: userData.id,
                    email: userData.email
                 }, "QWERTY12345", {expiresIn: "5days"});
                res.send({token});
            }
            else {
                res.status(401).send ({
                    err: " Wrong password"
                })
            }
        }
    }
    catch (err) {
        res.send(err)
    }
})


router.get("/", async (req,res)=>{
    if(req.isAuth){
        const userSnapshot = await Users.get(req.body.id).get()
        res.send({
            ...userSnapshot.data(),
            id:userSnapshot.id
        })
    }
    else{
        res.send({
            err:"unauthorized"
        })
    }
});

module.exports=router;



























// router.get('/:userID',async(req,res)=>{
//     const userSnapshot=await Users.doc(req.params.userID).get();
//     res.send({
//         ...userSnapshot.data(),
//         id: userSnapshot.id
//     })
// })


// router.get('/',(req,res)=>{
//     res.send('user home route')
// })

// router.get('/allUsers',async(req,res)=>{
//     const userSnapshot=await Users.get();
//         console.log(userSnapshot);
//         let data=[];
//         userSnapshot.forEach((doc)=>{
//             data.push({
//                 ...doc.data(),
//                 id:doc.id
//             })
//         })
//         res.send(data)
// })


// router.post('/addUser',async(req,res)=>{
//     const body=req.body;
//     const data=await Users.add({
//         ...body
//     })
//    res.send(data)
// })


// router.put('/updateUser/:userID',async(req,res)=>{
//     const data=await Users.doc(req.params.userID).update({
//         ...req.body
//     })
//     res.send(data)
// })



module.exports=router;