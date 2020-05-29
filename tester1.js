function testy(start, limit, ARR) {

    let x = start + 25;
    console.log("START::", x)
    let arr = new Array();
    for (let i = 1; i <= limit; i++)
        arr.push(i);

    let rows = Math.floor(x / 3);
    if ((x % 3) != 0)
        rows += 1;
    let stringy = '';
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < 3; j++) {

            if (x == 4) {
                stringy = `${arr[0]}\t${arr[2]}\t${arr[3]}\t\n${arr[1]}`
            }
            else if ((i + (rows * j)) < x) {
                stringy += `${arr[(i + (rows * j))]}\t`;
                console.log((i + (rows * j) + start));
            }
        }
        stringy += "\n"
    }
    console.log(stringy, "\n--------------------");
    console.log('@@@@@@@@@@@@@@@@@@@@')
    if ((start + 25) < limit) testy( (start + 25), limit) ;
}

testy(0, 30)