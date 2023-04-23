import express from "express"
import mongoose from "mongoose"
import path from "path"
import urlencoded from "body-parser";
import cookieParser from "cookie-parser";
import { render } from "ejs";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const app = express();

// connect with mongoose
mongoose.connect("mongodb://127.0.0.1:27017",{
    dbName:"Login-Page",
}).then(()=>{console.log("Database is connected")})
.catch((error)=>console.log(error));

const userSchema = new mongoose.Schema({
    name:String,
    email:String,
    password:String,
})

// creat a collection
const User = mongoose.model('user', userSchema);

app.set('view engine', 'ejs')

// middelware
app.use(express.static(path.join(path.resolve(),"public")));
app.use(express.urlencoded({extended:"true"}));
app.use(cookieParser());

const isAuth = async (req, res, next)=>{
    const {token} = req.cookies;
    if(token){
        const decoded = jwt.verify(token, 'aasdfasdf');
        console.log(decoded);
        req.user = await User.findById(decoded._id);
        next();
    }
    else{
        res.redirect('/login');
    }
}

app.get('/',isAuth,(req, res)=>{
    var name = req.user.name;
    res.render('logout',{name})
})
app.get('/register',(req, res)=>{
    res.render('register')
})
app.get('/login',(req, res)=>{
    res.render('login')
})


app.post('/register',async(req, res)=>{
    
    var {name, email, password} = req.body;

    let user = await User.findOne({email});

    if(user){
        return res.redirect('/login');
    }

    const hashpassword = await bcrypt.hash(password, 10);

    user = await User.create({name,email,password:hashpassword});

    const token = jwt.sign({_id:user._id},'aasdfasdf');
    // creating a cookie
    res.cookie("token", token,{
        httpOnly:true, expires:new Date(Date.now()+60000)
    })
    res.redirect('/');
})

app.post('/login',async(req, res)=>{
   
    const {email, password} = req.body;
    let user = await User.findOne({email});
    if(!user){
        return res.redirect("/register")
    }
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(isMatch)
    if(!isMatch){
        return res.render("login",{message:"incorrect Password"})
    }
    const token = jwt.sign({_id:user._id},'aasdfasdf');
    // creating a cookie
    res.cookie("token", token,{
        httpOnly:true, expires:new Date(Date.now()+60000)
    })
    res.redirect('/');
})

app.get('/logout',(req, res)=>{
    // creating a cookie
    res.cookie("token",null,{
        httpOnly:true, expires:new Date(Date.now())
    })
    res.render('login')
})

app.listen(4000, ()=>{
    console.log("server is work fine at port 4000");
})