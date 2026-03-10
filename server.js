const express = require("express")
const app = express()

app.use(express.json())
app.use(express.static("public"))

let students = []
let locations = {}


// REGISTER STUDENT
app.post("/api/register/student",(req,res)=>{

let student = req.body

students.push(student)

res.json({
message:"Student registered",
trackingAPI:`/api/location/${student.roll}`
})

})


// LOGIN STUDENT
app.post("/api/login/student",(req,res)=>{

let {roll,password} = req.body

let student = students.find(s => s.roll === roll)

if(!student){
return res.json({message:"Roll number not found"})
}

if(student.password === password){
res.json({
message:"Login successful",
api:`/api/location/${roll}`
})
}
else{
res.json({message:"Wrong password"})
}

})


// UPDATE LOCATION (student phone sends GPS)
app.post("/api/location/update",(req,res)=>{

let {roll,lat,lng} = req.body

locations[roll] = {
lat,
lng,
time:new Date()
}

res.json({message:"Location updated"})

})


// GET LOCATION (parent/teacher tracking)
app.get("/api/location/:roll",(req,res)=>{

let roll = req.params.roll

let location = locations[roll]

if(!location){
return res.json({message:"Location not available"})
}

res.json({
roll,
lat:location.lat,
lng:location.lng,
time:location.time
})

})


app.listen(3000,()=>{
console.log("Server running on port 3000")
})
