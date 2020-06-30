const x = function (params){


if(params.value) {console.log(params.value); return;}

    console.log(params);
    console.log("--------------")



   



}

let objy = {

    name: "Denys",
    last: 10
};



x(objy);

objy.age= 21;
x(objy);

let ram = JSON.parse(JSON.stringify(objy));
objy.age = 19;
console.log(ram)
console.log(objy)
//x(10);


//x( {value: 10} )

/*
say you need an object with values, then just make it. Oh you need to add more values to it? Just call object.newValue = whatever. And it will be auto added.

If you need 
*/