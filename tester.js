for (let i = 1; i <= 25; i++) {

    let rows = Math.floor(i / 3);
    if ((i % 3) > 0) rows++;
    console.log(`When ${i} you get ${rows} rows`)
}