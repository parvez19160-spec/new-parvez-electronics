
const express=require("express");
const session=require("express-session");
const multer=require("multer");
const fs=require("fs"),path=require("path"),crypto=require("crypto");
const app=express(),PORT=process.env.PORT||3000;
const DATA=path.join(__dirname,"data","store.json");
const uploadDir=path.join(__dirname,"uploads");
if(!fs.existsSync(uploadDir))fs.mkdirSync(uploadDir,{recursive:true});
const storage=multer.diskStorage({
 destination:(req,file,cb)=>cb(null,uploadDir),
 filename:(req,file,cb)=>{
   const ext=path.extname(file.originalname).toLowerCase();
   cb(null,Date.now()+"-"+crypto.randomBytes(4).toString("hex")+ext);
 }
});
const upload=multer({storage,limits:{fileSize:5*1024*1024},fileFilter:(req,file,cb)=>{
 if(/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype))cb(null,true); else cb(new Error("Only image files are allowed"));
}});
app.use(express.json());app.use(express.urlencoded({extended:true}));
app.use(session({secret:process.env.SESSION_SECRET||"CHANGE_THIS_SECRET",resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:"lax",secure:false,maxAge:8*60*60*1000}}));
app.use("/uploads",express.static(uploadDir));app.use(express.static(path.join(__dirname,"public")));
app.use(express.static(__dirname));
function hash(x){return crypto.createHash("sha256").update(x).digest("hex")}
function save(db){fs.writeFileSync(DATA,JSON.stringify(db,null,2))}
function load(){
 if(!fs.existsSync(DATA)){
  const db={brand:{name:"Parvez Nova Electronics",tagline:"Smart choice. Smarter life.",phone1:"9800121152",phone2:"9735455093"},
   admin:{username:"admin",passwordHash:hash("ChangeMe123!")},
   products:[
    {id:1,name:"Portable Mini Fan",category:"Home Gadgets",price:499,oldPrice:799,stock:20,image:"",description:"Portable rechargeable mini fan."},
    {id:2,name:"Wireless Earbuds",category:"Audio",price:1499,oldPrice:1999,stock:15,image:"",description:"Wireless earbuds with charging case."},
    {id:3,name:"Fast Charger",category:"Mobile Accessories",price:699,oldPrice:999,stock:25,image:"",description:"Fast Type-C charger."},
    {id:4,name:"Smart Watch",category:"Wearables",price:1999,oldPrice:2999,stock:10,image:"",description:"Smart watch with everyday fitness features."}
   ],orders:[]};save(db);return db;
 } return JSON.parse(fs.readFileSync(DATA,"utf8"));
}
function auth(req,res,next){if(!req.session.admin)return res.status(401).json({error:"Admin login required"});next()}
function orderId(){return "PNE-"+Date.now().toString().slice(-8)+"-"+crypto.randomBytes(2).toString("hex").toUpperCase()}

app.get("/api/store",(req,res)=>{const db=load();res.json({brand:db.brand,products:db.products})});
app.post("/api/orders",(req,res)=>{
 const db=load(),{customer,items,paymentMethod}=req.body;
 if(!customer?.name||!customer?.phone||!customer?.address||!Array.isArray(items)||!items.length)return res.status(400).json({error:"Complete customer details and cart are required."});
 let total=0,finalItems=[];
 for(const it of items){const p=db.products.find(x=>x.id===Number(it.id));const qty=Math.max(1,parseInt(it.qty)||1);if(!p||p.stock<qty)continue;total+=p.price*qty;finalItems.push({id:p.id,name:p.name,price:p.price,qty});}
 if(!finalItems.length)return res.status(400).json({error:"Products are unavailable or out of stock."});
 finalItems.forEach(i=>{const p=db.products.find(p=>p.id===i.id);p.stock-=i.qty});
 const order={id:orderId(),createdAt:new Date().toISOString(),status:"New",paymentStatus:"Pending",paymentMethod:paymentMethod||"COD",
 customer:{name:customer.name,phone:customer.phone,email:customer.email||"",address:customer.address,city:customer.city||"",pincode:customer.pincode||""},items:finalItems,total};
 db.orders.unshift(order);save(db);res.json({ok:true,orderId:order.id,total});
});
app.post("/api/admin/login",(req,res)=>{const db=load();if(req.body.username===db.admin.username&&hash(req.body.password||"")===db.admin.passwordHash){req.session.admin={username:db.admin.username};return res.json({ok:true})}res.status(401).json({error:"Invalid login"})});
app.post("/api/admin/logout",(req,res)=>req.session.destroy(()=>res.json({ok:true})));
app.get("/api/admin/me",(req,res)=>res.json({loggedIn:!!req.session.admin}));
app.get("/api/admin/orders",auth,(req,res)=>res.json(load().orders));
app.patch("/api/admin/orders/:id",auth,(req,res)=>{const db=load(),o=db.orders.find(x=>x.id===req.params.id);if(!o)return res.status(404).json({error:"Order not found"});const allowed=["New","Confirmed","Packed","Shipped","Delivered","Cancelled"];if(allowed.includes(req.body.status))o.status=req.body.status;if(req.body.paymentStatus)o.paymentStatus=req.body.paymentStatus;save(db);res.json(o)});
app.post("/api/admin/products",auth,upload.single("image"),(req,res)=>{
 const db=load(),p={id:Date.now(),name:req.body.name,category:req.body.category||"Electronics",price:Number(req.body.price),oldPrice:Number(req.body.oldPrice||0),stock:Number(req.body.stock||0),description:req.body.description||"",image:req.file?"/uploads/"+req.file.filename:""};
 if(!p.name||!Number.isFinite(p.price)||p.price<0)return res.status(400).json({error:"Product name and valid price are required."});
 db.products.unshift(p);save(db);res.json(p);
});
app.patch("/api/admin/products/:id",auth,upload.single("image"),(req,res)=>{
 const db=load(),p=db.products.find(x=>x.id===Number(req.params.id));if(!p)return res.status(404).json({error:"Product not found"});
 for(const k of ["name","category","description"])if(req.body[k]!==undefined)p[k]=req.body[k];
 for(const k of ["price","oldPrice","stock"])if(req.body[k]!==undefined)p[k]=Number(req.body[k]);
 if(req.file)p.image="/uploads/"+req.file.filename;save(db);res.json(p);
});
app.delete("/api/admin/products/:id",auth,(req,res)=>{const db=load();db.products=db.products.filter(p=>p.id!==Number(req.params.id));save(db);res.json({ok:true})});
app.get("/admin",(req,res)=>res.sendFile(path.join(__dirname,"public","admin.html")));
app.listen(PORT,()=>console.log("Parvez Nova Electronics running on port "+PORT));
