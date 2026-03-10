let studentData = {}
let map
let marker

function showLogin(){
document.getElementById("loginBox").classList.remove("hidden")
}

function showRegister(){
document.getElementById("roleSelect").classList.remove("hidden")
}

function selectRole(role){

if(role==="student"){
document.getElementById("studentRegister").classList.remove("hidden")
}

if(role==="parent"){
document.getElementById("trackBox").classList.remove("hidden")
}

}

function submitStudent(){

studentData = {
name:document.getElementById("name").value,
roll:document.getElementById("roll").value,
age:document.getElementById("age").value,
gender:document.getElementById("gender").value,
mother:document.getElementById("mother").value,
father:document.getElementById("father").value,
parentMobile:document.getElementById("parentMobile").value,
studentMobile:document.getElementById("studentMobile").value
}

document.getElementById("showRoll").innerText =
"Roll Number: "+studentData.roll

document.getElementById("passwordScreen").classList.remove("hidden")

}

function savePassword(){

studentData.password =
document.getElementById("password").value

fetch("/api/register/student",{
method:"POST",
headers:{'Content-Type':'application/json'},
body:JSON.stringify(studentData)
})

.then(res=>res.json())
.then(data=>{
alert("Student Registered")
location.reload()
})

}

function login(){

let roll=document.getElementById("loginRoll").value
let password=document.getElementById("loginPass").value

fetch("/api/login/student",{
method:"POST",
headers:{'Content-Type':'application/json'},
body:JSON.stringify({roll,password})
})

.then(res=>res.json())
.then(data=>{

document.getElementById("loginMsg").innerText=data.message

if(data.message==="Login successful"){
startTracking(roll)
}

})

}


function startTracking(roll){

navigator.geolocation.watchPosition(position=>{

let lat = position.coords.latitude
let lng = position.coords.longitude

fetch("/api/location/update",{
method:"POST",
headers:{'Content-Type':'application/json'},
body:JSON.stringify({
roll,
lat,
lng
})
})

})

}



function trackStudent(){

let roll=document.getElementById("trackRoll").value

map = L.map('map').setView([20,78],5)

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
maxZoom:19
}).addTo(map)

setInterval(()=>{

fetch(`/api/location/${roll}`)
.then(res=>res.json())
.then(data=>{

if(!data.lat) return

let lat = data.lat
let lng = data.lng

if(marker){
marker.setLatLng([lat,lng])
}
else{
marker = L.marker([lat,lng]).addTo(map)
map.setView([lat,lng],15)
}

})

},3000)

}
