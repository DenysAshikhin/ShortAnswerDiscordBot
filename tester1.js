function testy(start, limit, ARR) {

    let x = (start + 25) < limit ? start + 25 : limit;

    let arr = new Array();
    for (let i = 1; i <= limit; i++)
        arr.push(i);

    let rows = Math.floor((x - start) / 3);

    if ((x - start) == 4) rows++;
    else if ((((x - start) % 3) != 0) || (x - start) == 25) rows++;

    let stringy = '';

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < 3; j++) {

            if ((x - start) == 4) {
                stringy = `${arr[0 + start]}\t${arr[2 + start]}\t${arr[3 + start]}\t\n${arr[1 + start]}`
            }
            if ((start + i + (rows * j)) < x) {
                stringy += `${arr[(start + i + (rows * j))]}\t`;
            }
        }
        stringy += "\n"
    }
    console.log(stringy, "\n--------------------");
    if ((start + 25) < limit) testy((start + 25), limit);
}

testy(0, 120)
