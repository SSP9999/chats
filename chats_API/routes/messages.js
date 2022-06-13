const admin=require('firebase-admin');
const db=admin.firestore();
const messages=db.collection('messages');
const Users=db.collection('users');

const {Router}=require('express');

const router=new Router();

router.post("/send/:userId",async(req,res)=>{
    if(req.isAuth){
        const data=await messages.add({
            sender:req.userId, 
            receiver:req.params.userId,
            createAt:new Date(),
            text:req.body.message
        })
        const messagesId=data._path.segments[1]
        const updateSender=await Users.doc(req.userId).update({
            sentMessages:admin.firestore.FieldValue.arrayUnion(messagesId)
        });
        const updateReceiver=await Users.doc(req.userId).update({
            receiveMessages:admin.firestore.FieldValue.arrayUnion(messagesId)
        });
        res.send(data);
        return;
    }
    else{
        res.send({err:"unauthorized"});
        return;
    }
});

router.get("/allMessages",async(req,res)=>{
    if(req.isAuth){
        const sentMessagesSnap=await messages.where("sender", "==",req.userId).get();
        const receivedMessagesSnap=await messages.where("receiver", "==",req.userId).get();
        const result={
            sent:[],
            received:[]
        };
        sentMessagesSnap.forEach(e=>{
            result.sent.push({
                ...e.data(),
                id:e.id,
            })
        })
        receivedMessagesSnap.forEach(e=>{
            result.received.push({
                ...e.data(),
                id:e.id,
            })
        })
        res.send(result);
    }else{
        res.send({
            err:"unauthorized"
        })
    }
});


router.get("/getMessage/:msgId",async(req,res)=>{
    if(req.isAuth){
        const msgSnap=await messages.doc(req.params.msgId).get();
        res.send({
            ...msgSnap.data(),
            id:msgSnap.id
        })
    }
    else{
        res.send({
            err:"unauthorized"
        })
    }
});


router.put("/editMessage/:msgId",async(req,res)=>{
    if(req.isAuth){
        const msgSnap=await messages.doc(req.params.msgId).get();
        const {sender}=msgSnap.data();
        if(sender==req.userId){
            const data=await messages.doc(req.params.msgId).update({
                text:req.body.message
            });
            res.send(data);
        }else{
            res.send({
                err:"unauthorized access"
            })
        }
    }
    else{
        res.send({
            err:"unauthorized"
        });
    }
});

router.delete("/delete/:msgId",async(req,res)=>{
    if(req.isAuth){
        const msgSnap=await messages.doc(req.params.msgId).get();
        if(!msgSnap.exists) {
            res.send({err:"message not found"})
            return;
        } 
        const {sender,receiver}=msgSnap.data();
        if(sender==req.userId){
            const data=await messages.doc(req.params.msgId).delete();
            const updateSender=await Users.doc(sender).update({
                sentMessages:admin.firestore.FieldValue.arrayRemove(req.params.msgId),
            });
            const updateReceiver=await Users.doc(receiver).update({
                receivedMessages:admin.firestore.FieldValue.arrayRemove(req.params.msgId),
            });
            res.send(data);
        }else if(receiver==req.userId){
            const updateReceiver=await Users.doc(receiver).update({
                receivedMessages:admin.firestore.FieldValue.arrayRemove(req.params.msgId),
            });
            res.send(updateReceiver);
        }
        else{
            res.send({
                err:"unauthorized Access"
            })
        }  
    }
    else{
        res.send({
            err:"unauthorized"
        })
    }
});

module.exports=router;